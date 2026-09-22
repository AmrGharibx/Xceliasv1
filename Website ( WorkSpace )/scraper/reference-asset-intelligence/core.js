'use strict';

const { canonicalProjectName, text } = require('../price-intelligence/core');
const { hasProjectImage, isSafeImageUrl } = require('../catalog-intelligence/core');
const { preserveReferences } = require('../asset-intelligence/core');

function urlValue(value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value.url : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

function safeHttpsUrl(value) {
  try {
    const parsed = new URL(String(value || '').replace(/&amp;/g, '&'));
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function planAsset(value) {
  const url = safeHttpsUrl(urlValue(value));
  if (!url) return null;
  const path = new URL(url).pathname.toLowerCase();
  if (isSafeImageUrl(url)) return url;
  if (/\.pdf$/i.test(path)) return { url, kind: 'pdf' };
  return null;
}

function planAssets(values) {
  const candidates = Array.isArray(values) ? values : [values];
  const byUrl = new Map();
  candidates.map(planAsset).filter(Boolean).forEach((asset) => {
    byUrl.set(urlValue(asset), asset);
  });
  return [...byUrl.values()];
}

function isPageReference(value) {
  const url = safeHttpsUrl(urlValue(value));
  return Boolean(url && !planAsset(url));
}

function projectReferencePages(data) {
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const detailsByProject = data?.projectDetails || {};
  const pages = [];
  const seen = new Set();
  projects.forEach((project) => {
    const details = detailsByProject[project.name] || {};
    const values = [
      details.masterplan,
      ...(Array.isArray(details.layouts) ? details.layouts : []),
      ...(Array.isArray(details.assetReferences?.masterplan)
        ? details.assetReferences.masterplan
        : []),
      ...(Array.isArray(details.assetReferences?.layouts) ? details.assetReferences.layouts : []),
    ];
    values.filter(isPageReference).forEach((value) => {
      const url = safeHttpsUrl(value);
      const key = `${project.name}\u0000${url}`;
      if (seen.has(key)) return;
      seen.add(key);
      pages.push({ projectName: project.name, url });
    });
  });
  return pages;
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(
    new RegExp(`\\b${escaped}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, 'i'),
  );
  return match ? match[1] || match[2] || match[3] || '' : '';
}

function absoluteUrl(value, pageUrl) {
  try {
    const url = new URL(String(value || '').replace(/&amp;/g, '&'), pageUrl);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function classifyPlanCandidate(url, context) {
  const urlText = decodeURIComponent(url).toLowerCase();
  const labelText = String(context || '').toLowerCase();
  if (
    /master[\s_-]*plan|site[\s_-]*plan/.test(urlText) ||
    /master[\s_-]*plan|site[\s_-]*plan/.test(labelText)
  ) {
    return 'masterplan';
  }
  if (
    /floor[\s_-]*plan|floorplan|unit[\s_-]*plan|layout/.test(urlText) ||
    /floor[\s_-]*plan|floorplan|unit[\s_-]*plan|layout/.test(labelText)
  ) {
    return 'layout';
  }
  return null;
}

function isProjectSpecific(projectName, html, pageUrl) {
  const normalized = canonicalProjectName(projectName);
  const tokens = normalized.split(' ').filter((token) => token.length >= 3);
  if (!tokens.length) return false;
  const title = [
    attribute(html.match(/<title\b[^>]*>[\s\S]*?<\/title>/i)?.[0] || '', 'content'),
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '',
    attribute(html.match(/<meta\b[^>]*(?:property|name)=[\"']og:title[\"'][^>]*>/i)?.[0] || '', 'content'),
    attribute(html.match(/<meta\b[^>]*(?:property|name)=[\"']twitter:title[\"'][^>]*>/i)?.[0] || '', 'content'),
  ].join(' ');
  const haystack = text(title);
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return tokens.length === 1 ? hits === 1 : hits / tokens.length >= 0.5;
}

function metaImage(html, pageUrl) {
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metas) {
    const key = `${attribute(tag, 'property')} ${attribute(tag, 'name')}`.toLowerCase();
    if (!/(^|\s)(og:image|twitter:image)(\s|$)/.test(key)) continue;
    const url = absoluteUrl(attribute(tag, 'content'), pageUrl);
    const path = url ? new URL(url).pathname : '';
    if (url && isSafeImageUrl(url) && !/(?:logo|favicon|icon|placeholder)/i.test(path)) {
      return url;
    }
  }
  return '';
}

/**
 * Find only semantically labelled plan assets. A generic hero/OG image can be
 * used as a project cover (after a project-identity check), never as a plan.
 */
function extractReferenceAssets(projectName, html, pageUrl) {
  if (typeof html !== 'string' || !html) {
    return { matchedProject: false, coverImage: '', masterplans: [], layouts: [] };
  }
  const matchedProject = isProjectSpecific(projectName, html, pageUrl);
  if (!matchedProject) {
    return { matchedProject: false, coverImage: '', masterplans: [], layouts: [] };
  }

  const masterplans = new Map();
  const layouts = new Map();
  const addCandidate = (rawUrl, index, tag = '') => {
    const url = absoluteUrl(rawUrl, pageUrl);
    const asset = planAsset(url);
    if (!asset) return;
    // Tag attributes/alt text are reliable semantic evidence. Serialized
    // client state supplies no element label, so it must identify the plan in
    // the asset URL itself; a nearby page heading is not sufficient evidence.
    const context = tag || '';
    const kind = classifyPlanCandidate(url, context);
    if (kind === 'masterplan') masterplans.set(urlValue(asset), asset);
    if (kind === 'layout') layouts.set(urlValue(asset), asset);
  };

  const tagPattern = /<(?:img|source|a|iframe)\b[^>]*>/gi;
  let tagMatch;
  while ((tagMatch = tagPattern.exec(html))) {
    const tag = tagMatch[0];
    ['src', 'href', 'data-src', 'data-lazy-src', 'data-original'].forEach((name) => {
      addCandidate(attribute(tag, name), tagMatch.index, tag);
    });
  }

  const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptPattern.exec(html))) {
    const script = scriptMatch[1];
    const scriptOffset = scriptMatch.index + scriptMatch[0].indexOf(script);
    const inlineUrl = /https?:[^\"'<>\\\s]+/gi;
    let urlMatch;
    while ((urlMatch = inlineUrl.exec(script))) {
      addCandidate(urlMatch[0], scriptOffset + urlMatch.index);
    }
  }

  return {
    matchedProject: true,
    coverImage: metaImage(html, pageUrl),
    masterplans: [...masterplans.values()],
    layouts: [...layouts.values()],
  };
}

function emptyDetails() {
  return {
    unitTypes: '',
    areas: '',
    paymentPlan: '',
    status: '',
    amenities: '',
    description: '',
    masterplan: '',
    layouts: [],
    images: [],
  };
}

function applyReferenceAssets(data, records, observedAt) {
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const detailsByProject = data?.projectDetails || {};
  const byProject = new Map();
  (records || []).forEach((record) => {
    if (!record?.projectName || !record?.matchedProject) return;
    const current = byProject.get(record.projectName) || {
      coverImages: [],
      masterplans: [],
      layouts: [],
    };
    if (record.coverImage && isSafeImageUrl(record.coverImage)) {
      current.coverImages.push(record.coverImage);
    }
    current.masterplans.push(...planAssets(record.masterplans));
    current.layouts.push(...planAssets(record.layouts));
    byProject.set(record.projectName, current);
  });

  const nextDetails = { ...detailsByProject };
  let imagesAdded = 0;
  let masterplansAdded = 0;
  let layoutsAdded = 0;
  let detailsCreated = 0;
  byProject.forEach((incoming, projectName) => {
    let details = nextDetails[projectName] || emptyDetails();
    let changed = !nextDetails[projectName];
    if (changed) detailsCreated += 1;
    const coverImages = [...new Set(incoming.coverImages)];
    const masterplans = planAssets(incoming.masterplans);
    const layouts = planAssets(incoming.layouts);

    if (!hasProjectImage(details) && coverImages.length) {
      details = { ...details, images: coverImages.slice(0, 4) };
      imagesAdded += 1;
      changed = true;
    }
    if (!planAssets(details.masterplan).length && masterplans.length) {
      details = preserveReferences(details, 'masterplan', details.masterplan);
      details = { ...details, masterplan: masterplans[0] };
      masterplansAdded += 1;
      changed = true;
    }
    if (!planAssets(details.layouts).length && layouts.length) {
      details = preserveReferences(details, 'layouts', details.layouts);
      details = { ...details, layouts: layouts.slice(0, 12) };
      layoutsAdded += 1;
      changed = true;
    }
    if (changed) {
      nextDetails[projectName] = {
        ...details,
        assetMeta: {
          ...(details.assetMeta || {}),
          lastReferenceEnrichedAt: observedAt,
        },
      };
    }
  });

  return {
    data: { ...data, projectDetails: nextDetails },
    summary: {
      referencesMatched: byProject.size,
      imagesAdded,
      masterplansAdded,
      layoutsAdded,
      detailsCreated,
      missingPhotos: projects.filter((project) => !hasProjectImage(nextDetails[project.name])).length,
    },
  };
}

module.exports = {
  applyReferenceAssets,
  extractReferenceAssets,
  isPageReference,
  isProjectSpecific,
  planAsset,
  planAssets,
  projectReferencePages,
};
