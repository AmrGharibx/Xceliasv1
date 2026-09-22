'use strict';

const DEFAULT_USER_AGENT = 'XceliasPriceMonitor/1.0 (+https://xcelias.com)';

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function toFiniteNumber(value) {
  const number = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
}

function validEgpPrice(value) {
  const price = toFiniteNumber(value);
  return price !== null && price >= 100000 && price <= 2000000000
    ? Math.round(price)
    : null;
}

function httpsUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function paymentPlan(downPayment, installmentYears) {
  const down = toFiniteNumber(downPayment);
  const years = toFiniteNumber(installmentYears);
  if (down === null && years === null) return null;
  const parts = [];
  if (down !== null) parts.push(`${down}% Down Payment`);
  if (years !== null) parts.push(`${years} Years Installments`);
  return parts.join(', ');
}

function sourceResult(source, observations, error = null) {
  return {
    source,
    ok: !error,
    observations,
    error: error ? 'The source could not be refreshed safely.' : null,
  };
}

function createRequester(config) {
  const lastRequestAt = new Map();
  const userAgent = config.userAgent || DEFAULT_USER_AGENT;
  const timeoutMs = Number(config.timeoutMs) || 25000;
  const retryCount = Number(config.retryCount) || 3;

  async function pace(sourceKey, minimumDelayMs) {
    const last = lastRequestAt.get(sourceKey) || 0;
    const remaining = Number(minimumDelayMs || 0) - (Date.now() - last);
    if (remaining > 0) await sleep(remaining);
    lastRequestAt.set(sourceKey, Date.now());
  }

  async function request(sourceKey, url, options = {}) {
    const safeUrl = httpsUrl(url);
    if (!safeUrl) throw new Error('Invalid source URL');

    const headers = {
      Accept: options.accept || 'application/json, text/plain, */*',
      'Accept-Language': 'en',
      'User-Agent': userAgent,
      ...(options.headers || {}),
    };

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      await pace(sourceKey, options.minimumDelayMs);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(safeUrl, {
          headers,
          signal: controller.signal,
        });
        if (response.ok) return response;

        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === retryCount) {
          throw new Error(`Source response ${response.status}`);
        }

        const retryAfterSeconds = Number(response.headers.get('retry-after'));
        const waitMs = Number.isFinite(retryAfterSeconds)
          ? Math.max(1000, retryAfterSeconds * 1000)
          : 1000 * 2 ** attempt;
        await sleep(waitMs);
      } catch (error) {
        if (attempt === retryCount) throw error;
        await sleep(1000 * 2 ** attempt);
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error('Source request failed');
  }

  async function json(sourceKey, url, options) {
    const response = await request(sourceKey, url, options);
    const body = await response.text();
    if (body.length > 12000000) throw new Error('Source response is too large');
    try {
      return JSON.parse(body);
    } catch {
      throw new Error('Source returned invalid JSON');
    }
  }

  async function html(sourceKey, url, options) {
    const response = await request(sourceKey, url, {
      ...options,
      accept: 'text/html,application/xhtml+xml',
    });
    const body = await response.text();
    if (body.length > 6000000) throw new Error('Source response is too large');
    return body;
  }

  return { json, html };
}

function nawyObservation(project) {
  const plan = project?.developerPlan || {};
  const priceMin = validEgpPrice(plan.minPrice);
  if (!priceMin || String(plan.currency || 'EGP').toUpperCase() !== 'EGP') return null;

  const coordinates = Array.isArray(project.coordinates) ? project.coordinates : [];
  const downPayment = toFiniteNumber(plan.downPaymentPercentage);
  const installmentYears = toFiniteNumber(plan.numberOfInstallmentYears);
  const unitTypes = Array.isArray(project.propertyTypes)
    ? project.propertyTypes.map((item) => item?.name).filter(Boolean)
    : [];

  return {
    source: 'Nawy',
    sourceId: `nawy:${project.id}`,
    priority: 100,
    name: project.name,
    developer: project.developerName,
    zone: project.parentAreaName || project.areaName,
    lat: toFiniteNumber(coordinates[1]),
    lng: toFiniteNumber(coordinates[0]),
    priceMin,
    currency: 'EGP',
    url: httpsUrl(`https://www.nawy.com/compound/${project.slug}`),
    enrichment: {
      unitTypes,
      downPayment,
      installmentYears,
      paymentPlan: paymentPlan(downPayment, installmentYears),
    },
  };
}

async function collectNawy(requester, sourceConfig) {
  const key = 'nawy';
  try {
    const pageSize = Math.min(50, Math.max(12, Number(sourceConfig.pageSize) || 50));
    const getPage = (page) => {
      const url = new URL('https://listing-api.nawy.com/v1/search/compounds');
      url.searchParams.set('page', String(page));
      url.searchParams.set('pageSize', String(pageSize));
      return requester.json(key, url.toString(), {
        minimumDelayMs: sourceConfig.minimumDelayMs,
        headers: {
          'x-region': 'eg',
          platform: 'web',
        },
      });
    };

    const firstPage = await getPage(1);
    const total = Number(firstPage?.total);
    if (!Array.isArray(firstPage?.results) || !Number.isFinite(total) || total < 0) {
      throw new Error('Nawy response shape changed');
    }
    const pageCount = Math.ceil(total / pageSize);
    if (pageCount > 100) throw new Error('Nawy pagination is outside safe bounds');

    const rows = [...firstPage.results];
    for (let page = 2; page <= pageCount; page += 1) {
      const nextPage = await getPage(page);
      if (!Array.isArray(nextPage?.results)) throw new Error('Nawy page shape changed');
      rows.push(...nextPage.results);
    }

    return sourceResult(key, rows.map(nawyObservation).filter(Boolean));
  } catch {
    return sourceResult(key, [], true);
  }
}

function nawyInventoryRecord(project) {
  const coordinates = Array.isArray(project?.coordinates) ? project.coordinates : [];
  const plan = project?.developerPlan || {};
  const downPayment = toFiniteNumber(plan.downPaymentPercentage);
  const installmentYears = toFiniteNumber(plan.numberOfInstallmentYears);
  const unitTypes = Array.isArray(project?.propertyTypes)
    ? project.propertyTypes.map((item) => item?.name).filter(Boolean)
    : [];

  const id = Number(project?.id);
  const name = String(project?.name || '').trim();
  const developer = String(project?.developerName || '').trim();
  const zone = String(project?.parentAreaName || project?.areaName || '').trim();
  const imageUrl = httpsUrl(project?.imageUrl);
  const lat = toFiniteNumber(coordinates[1]);
  const lng = toFiniteNumber(coordinates[0]);

  if (!Number.isFinite(id) || !name || !developer || lat === null || lng === null) {
    return null;
  }

  return {
    source: 'Nawy inventory',
    sourceId: `nawy-inventory:${id}`,
    name,
    developer,
    zone,
    lat,
    lng,
    imageUrl,
    slug: String(project?.slug || '').trim(),
    priceMin:
      String(plan.currency || 'EGP').toUpperCase() === 'EGP'
        ? validEgpPrice(plan.minPrice)
        : null,
    currency: 'EGP',
    unitTypes,
    downPayment,
    installmentYears,
    paymentPlan: paymentPlan(downPayment, installmentYears),
  };
}

/**
 * Fetch the active public compound inventory used for catalogue coverage and
 * image enrichment. This remains separate from price publication: a source
 * observation alone never marks a price as verified.
 */
async function collectNawyInventory(config) {
  const requester = createRequester(config || {});
  const sourceConfig = config?.sources?.nawy || {};
  const key = 'nawy-inventory';
  try {
    const pageSize = Math.min(50, Math.max(12, Number(sourceConfig.pageSize) || 50));
    const getPage = (page) => {
      const url = new URL('https://listing-api.nawy.com/v1/search/compounds');
      url.searchParams.set('page', String(page));
      url.searchParams.set('pageSize', String(pageSize));
      return requester.json(key, url.toString(), {
        minimumDelayMs: Math.max(650, Number(sourceConfig.minimumDelayMs) || 0),
        headers: {
          'x-region': 'eg',
          platform: 'web',
        },
      });
    };

    const firstPage = await getPage(1);
    const total = Number(firstPage?.total);
    if (!Array.isArray(firstPage?.results) || !Number.isFinite(total) || total < 0) {
      throw new Error('Nawy inventory response shape changed');
    }
    const pageCount = Math.ceil(total / pageSize);
    if (pageCount > 100) throw new Error('Nawy inventory pagination is outside safe bounds');

    const rows = [...firstPage.results];
    for (let page = 2; page <= pageCount; page += 1) {
      const nextPage = await getPage(page);
      if (!Array.isArray(nextPage?.results)) {
        throw new Error('Nawy inventory page shape changed');
      }
      rows.push(...nextPage.results);
    }

    return {
      ...sourceResult(key, rows.map(nawyInventoryRecord).filter(Boolean)),
      total,
    };
  } catch {
    return { ...sourceResult(key, [], true), total: 0 };
  }
}

function redUnitTypes(typeCounts) {
  if (!typeCounts || typeof typeCounts !== 'object') return [];
  if (Array.isArray(typeCounts)) {
    return typeCounts
      .map((item) => item?.name || item?.type || item)
      .filter((item) => typeof item === 'string' && item.trim());
  }
  return Object.keys(typeCounts).filter((item) => !/^\d+$/.test(item));
}

function redObservation(project) {
  const priceMin = validEgpPrice(project?.starts_from);
  if (!priceMin || String(project?.currency || 'EGP').toUpperCase() !== 'EGP') return null;

  return {
    source: 'RED',
    sourceId: `red:${project.id}`,
    priority: 90,
    name: project.name,
    developer: project.developer?.name,
    zone: project.area?.name,
    lat: toFiniteNumber(project.lat),
    lng: toFiniteNumber(project.lng),
    priceMin,
    currency: 'EGP',
    url: httpsUrl(`https://redww.com/en/projects/${project.slug}`),
    enrichment: {
      unitTypes: redUnitTypes(project.type_counts),
      downPayment: null,
      installmentYears: null,
      paymentPlan: null,
    },
  };
}

function directImageUrl(value) {
  const safeUrl = httpsUrl(value);
  if (!safeUrl) return null;
  return /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(new URL(safeUrl).pathname)
    ? safeUrl
    : null;
}

function projectImageUrls(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .map((item) => (item && typeof item === 'object' ? item.image || item.url : item))
    .map(directImageUrl)
    .filter(Boolean);
}

function redAssetRecord(project) {
  const imageUrls = [
    ...projectImageUrls(project?.cover_image),
    ...projectImageUrls(project?.images),
    ...projectImageUrls(project?.project_images),
  ];
  const layouts = [
    ...projectImageUrls(project?.layouts),
    ...projectImageUrls(project?.floor_plans),
    ...projectImageUrls(project?.floorPlans),
  ];
  const sourceId = Number(project?.id);
  const name = String(project?.name || '').trim();
  const developer = String(project?.developer?.name || '').trim();
  const zone = String(project?.area?.name || '').trim();
  if (!Number.isFinite(sourceId) || !name || !developer || !zone) return null;

  return {
    source: 'RED asset',
    sourceId: `red-asset:${sourceId}`,
    name,
    developer,
    zone,
    lat: toFiniteNumber(project?.lat),
    lng: toFiniteNumber(project?.lng),
    // The matching index uses a finite value. Asset enrichment never publishes
    // this observation as a verified price.
    priceMin: validEgpPrice(project?.starts_from) || 0,
    imageUrls: [...new Set(imageUrls)],
    masterplan: directImageUrl(project?.master_plan?.image),
    layouts: [...new Set(layouts)],
    url: httpsUrl(`https://redww.com/en/projects/${project?.slug || ''}`),
  };
}

async function collectRedRows(requester, sourceConfig, key = 'red', options = {}) {
  try {
    const pageSize = Math.min(100, Math.max(12, Number(sourceConfig.pageSize) || 100));
    const getPage = (page) => {
      const url = new URL('https://backend.redww.com/en/api/projects/');
      url.searchParams.set('page', String(page));
      url.searchParams.set('page_size', String(pageSize));
      url.searchParams.set('show_sold_out', options.includeSoldOut ? 'true' : 'false');
      return requester.json(key, url.toString(), {
        minimumDelayMs: sourceConfig.minimumDelayMs,
        headers: {
          // RED's backend keeps some undici connections open after the body.
          // Closing each modest page avoids a stalled inventory run.
          Connection: 'close',
        },
      });
    };

    const firstPage = await getPage(1);
    const pageCount = Number(firstPage?.pages_number);
    if (!Array.isArray(firstPage?.results) || !Number.isFinite(pageCount) || pageCount < 1) {
      throw new Error('RED response shape changed');
    }
    if (pageCount > 100) throw new Error('RED pagination is outside safe bounds');

    const rows = [...firstPage.results];
    for (let page = 2; page <= pageCount; page += 1) {
      const nextPage = await getPage(page);
      if (!Array.isArray(nextPage?.results)) throw new Error('RED page shape changed');
      rows.push(...nextPage.results);
    }

    return sourceResult(key, rows);
  } catch {
    return sourceResult(key, [], true);
  }
}

async function collectRed(requester, sourceConfig) {
  const result = await collectRedRows(requester, sourceConfig, 'red');
  return {
    ...result,
    observations: result.observations.map(redObservation).filter(Boolean),
  };
}

/**
 * Retrieve display assets separately from the price monitor so image and plan
 * enrichment never changes a published price or its verification state.
 */
async function collectRedAssetInventory(config) {
  const requester = createRequester(config || {});
  const sourceConfig = config?.sources?.red || {};
  const result = await collectRedRows(requester, sourceConfig, 'red-assets', {
    includeSoldOut: true,
  });
  return {
    ...result,
    observations: result.observations.map(redAssetRecord).filter(Boolean),
  };
}

function parseNextData(html) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) throw new Error('Structured source data was not found');
  try {
    return JSON.parse(match[1]);
  } catch {
    throw new Error('Structured source data is invalid');
  }
}

function propertyFinderObservation(project) {
  const priceMin = validEgpPrice(project?.startingPrice);
  if (!priceMin) return null;
  const coordinates = project.location?.coordinates || {};
  const downPayment = toFiniteNumber(project.downPaymentPercentage);
  const unitTypes = Array.isArray(project.propertyTypes)
    ? project.propertyTypes
        .map((item) => (typeof item === 'string' ? item : item?.name))
        .filter(Boolean)
    : [];

  return {
    source: 'Property Finder',
    sourceId: `property-finder:${project.id}`,
    priority: 95,
    name: project.title,
    developer: project.developer?.name,
    zone: project.location?.fullName,
    lat: toFiniteNumber(coordinates.lat),
    lng: toFiniteNumber(coordinates.lng ?? coordinates.lon),
    priceMin,
    currency: 'EGP',
    url: httpsUrl(`https://www.propertyfinder.eg${project.shareUrl || ''}`),
    enrichment: {
      unitTypes,
      downPayment,
      installmentYears: null,
      paymentPlan: downPayment === null ? null : `${downPayment}% Down Payment`,
    },
  };
}

function propertyFinderAssetRecord(project) {
  const coordinates = project?.location?.coordinates || {};
  const sourceId = String(project?.id || '').trim();
  const name = String(project?.title || '').trim();
  const developer = String(project?.developer?.name || '').trim();
  const zone = String(project?.location?.fullName || '').trim();
  if (!sourceId || !name || !developer || !zone) return null;

  return {
    source: 'Property Finder asset',
    sourceId: `property-finder-asset:${sourceId}`,
    name,
    developer,
    zone,
    lat: toFiniteNumber(coordinates.lat),
    lng: toFiniteNumber(coordinates.lng ?? coordinates.lon),
    // Used solely by the safe matcher. This never publishes a price.
    priceMin: validEgpPrice(project?.startingPrice) || 0,
    imageUrls: [...new Set(projectImageUrls(project?.images))],
    masterplan: null,
    layouts: [],
    url: httpsUrl(`https://www.propertyfinder.eg${project?.shareUrl || ''}`),
  };
}

async function collectPropertyFinderRows(requester, sourceConfig, key = 'property-finder') {
  try {
    const getPage = async (page) => {
      const url = new URL('https://www.propertyfinder.eg/en/new-projects');
      url.searchParams.set('page', String(page));
      const html = await requester.html(key, url.toString(), {
        minimumDelayMs: sourceConfig.minimumDelayMs,
      });
      const data = parseNextData(html);
      return data?.props?.pageProps?.searchResult;
    };

    const firstPage = await getPage(1);
    const pageCount = Number(firstPage?.meta?.pagination?.total);
    if (!Array.isArray(firstPage?.data?.projects) || !Number.isFinite(pageCount) || pageCount < 1) {
      throw new Error('Property Finder response shape changed');
    }
    if (pageCount > 100) throw new Error('Property Finder pagination is outside safe bounds');

    const rows = [...firstPage.data.projects];
    for (let page = 2; page <= pageCount; page += 1) {
      const nextPage = await getPage(page);
      if (!Array.isArray(nextPage?.data?.projects)) {
        throw new Error('Property Finder page shape changed');
      }
      rows.push(...nextPage.data.projects);
    }

    return sourceResult(key, rows);
  } catch {
    return sourceResult(key, [], true);
  }
}

async function collectPropertyFinder(requester, sourceConfig) {
  const result = await collectPropertyFinderRows(requester, sourceConfig, 'property-finder');
  return {
    ...result,
    observations: result.observations.map(propertyFinderObservation).filter(Boolean),
  };
}

async function collectPropertyFinderAssetInventory(config) {
  const requester = createRequester(config || {});
  const sourceConfig = config?.sources?.propertyFinder || {};
  const result = await collectPropertyFinderRows(
    requester,
    sourceConfig,
    'property-finder-assets',
  );
  return {
    ...result,
    observations: result.observations.map(propertyFinderAssetRecord).filter(Boolean),
  };
}

async function collectSources(config, mode) {
  const requester = createRequester(config);
  const enabled = config.sources || {};
  const collectors = [];
  if (enabled.nawy?.enabled !== false) collectors.push(collectNawy(requester, enabled.nawy));
  if (enabled.red?.enabled !== false) collectors.push(collectRed(requester, enabled.red));
  if (mode === 'daily' && enabled.propertyFinder?.enabled !== false) {
    collectors.push(collectPropertyFinder(requester, enabled.propertyFinder));
  }
  return Promise.all(collectors);
}

module.exports = {
  collectPropertyFinderAssetInventory,
  collectRedAssetInventory,
  collectNawyInventory,
  collectSources,
  createRequester,
  parseNextData,
  propertyFinderObservation,
  redObservation,
  validEgpPrice,
};
