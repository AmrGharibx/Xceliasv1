'use strict';

/**
 * Pure matching and publication rules for Property Explorer price intelligence.
 * These helpers intentionally have no network or file-system access so they can
 * be tested independently and cannot accidentally publish untrusted input.
 */

const PROJECT_NOISE = new Set([
  'compound',
  'project',
  'residence',
  'residences',
  'development',
  'developments',
]);

const DEVELOPER_NOISE = new Set([
  'development',
  'developments',
  'developer',
  'developers',
  'properties',
  'property',
  'real',
  'estate',
  'group',
  'holding',
  'holdings',
  'company',
  'co',
  'egypt',
]);

const LOCATION_PHRASES = [
  'new cairo',
  'north coast',
  'north coast sahel',
  'ras el hekma',
  'ain sokhna',
  'el gouna',
  'new capital',
  'sixth of october',
  '6th of october',
  'sheikh zayed',
  'el sheikh zayed',
  'new zayed',
  'mostakbal city',
  'new alamein',
  'sidi abdel rahman',
];

const DEVELOPER_ALIASES = new Map([
  ['sixth of october development and investment company', 'sodic'],
  ['sodic', 'sodic'],
  ['landmark sabbour', 'lmd'],
  ['lmd', 'lmd'],
  ['hassan allam properties', 'hassan allam'],
  ['hassan allam holding', 'hassan allam'],
  ['ora developers', 'ora'],
  ['ora developer', 'ora'],
  ['city edge developments', 'city edge'],
  ['city edge', 'city edge'],
  ['misr italia properties', 'misr italia'],
  ['misr italia', 'misr italia'],
  ['saudi egyptian developers sed', 'sed'],
  ['sed', 'sed'],
]);

function text(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function words(value) {
  return text(value).split(' ').filter(Boolean);
}

function normalizeProjectName(value) {
  return words(value)
    .filter((word) => !PROJECT_NOISE.has(word))
    .join(' ');
}

function canonicalProjectName(value) {
  let normalized = normalizeProjectName(value);
  for (const phrase of LOCATION_PHRASES) {
    const normalizedPhrase = text(phrase);
    normalized = normalized
      .replace(new RegExp(`(^| )${normalizedPhrase}(?= |$)`, 'g'), ' ')
      .trim();
  }
  return normalized.replace(/\s+/g, ' ');
}

function normalizeDeveloper(value) {
  const raw = text(value);
  if (DEVELOPER_ALIASES.has(raw)) return DEVELOPER_ALIASES.get(raw);

  const normalized = raw
    .split(' ')
    .filter((word) => !DEVELOPER_NOISE.has(word))
    .join(' ');
  return DEVELOPER_ALIASES.get(normalized) || normalized;
}

function zoneFamily(value) {
  const zone = text(value);
  if (!zone) return '';
  if (/north coast|sahel|ras el hekma|sidi abdel rahman|alamein/.test(zone)) {
    return 'north-coast';
  }
  if (/ain sokhna|sokhna|galala|zaafarana/.test(zone)) return 'sokhna';
  if (/gouna|hurghada|red sea|soma bay|sahl hasheesh/.test(zone)) {
    return 'red-sea';
  }
  if (/new cairo|fifth settlement|6th settlement|sixth settlement|north investors|mostakbal|madinaty|shorouk|heliopolis/.test(zone)) {
    return 'east-cairo';
  }
  if (/new capital|administrative capital/.test(zone)) return 'new-capital';
  if (/6th of october|sixth of october|october gardens|october/.test(zone)) {
    return 'west-cairo';
  }
  if (/zayed/.test(zone)) return 'zayed';
  return zone;
}

function diceSimilarity(left, right) {
  const a = String(left || '').replace(/\s/g, '');
  const b = String(right || '').replace(/\s/g, '');
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = (source) => {
    const output = new Set();
    for (let index = 0; index < source.length - 1; index += 1) {
      output.add(source.slice(index, index + 2));
    }
    return output;
  };

  const leftBigrams = bigrams(a);
  const rightBigrams = bigrams(b);
  let intersection = 0;
  leftBigrams.forEach((item) => {
    if (rightBigrams.has(item)) intersection += 1;
  });
  return (2 * intersection) / (leftBigrams.size + rightBigrams.size);
}

function tokenSimilarity(left, right) {
  const leftTokens = new Set(words(left));
  const rightTokens = new Set(words(right));
  if (!leftTokens.size || !rightTokens.size) return 0;
  let intersection = 0;
  leftTokens.forEach((item) => {
    if (rightTokens.has(item)) intersection += 1;
  });
  return intersection / Math.min(leftTokens.size, rightTokens.size);
}

function developerSimilarity(left, right) {
  const a = normalizeDeveloper(left);
  const b = normalizeDeveloper(right);
  if (!a || !b || a === 'unknown' || b === 'unknown') return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.88;
  return Math.max(diceSimilarity(a, b), tokenSimilarity(a, b));
}

function zoneSimilarity(left, right) {
  const a = zoneFamily(left);
  const b = zoneFamily(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if ((a === 'east-cairo' && b === 'new-capital') || (a === 'new-capital' && b === 'east-cairo')) {
    return 0.25;
  }
  if ((a === 'zayed' && b === 'west-cairo') || (a === 'west-cairo' && b === 'zayed')) {
    return 0.45;
  }
  return 0;
}

function haversineKilometers(left, right) {
  const lat1 = Number(left?.lat);
  const lng1 = Number(left?.lng);
  const lat2 = Number(right?.lat);
  const lng2 = Number(right?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = radians(lat2 - lat1);
  const deltaLng = radians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreCandidate(project, observation) {
  const projectName = normalizeProjectName(project?.name);
  const observationName = normalizeProjectName(observation?.name);
  const projectCanonical = canonicalProjectName(project?.name);
  const observationCanonical = canonicalProjectName(observation?.name);
  const exactName = Boolean(projectName && projectName === observationName);
  const canonicalName = Boolean(
    projectCanonical && projectCanonical === observationCanonical,
  );
  const nameSimilarity = exactName
    ? 1
    : canonicalName
      ? 0.98
      : Math.max(
          diceSimilarity(projectName, observationName),
          diceSimilarity(projectCanonical, observationCanonical),
          tokenSimilarity(projectCanonical, observationCanonical),
        );
  const developer = developerSimilarity(project?.dev || project?.developer, observation?.developer);
  const zone = zoneSimilarity(project?.zone, observation?.zone);
  const distanceKm = haversineKilometers(project, observation);

  let score = nameSimilarity * 0.72 + developer * 0.2 + zone * 0.08;
  if (distanceKm !== null && distanceKm <= 0.5) score += 0.08;
  else if (distanceKm !== null && distanceKm <= 2) score += 0.04;

  return {
    observation,
    score: Math.min(1, score),
    exactName,
    canonicalName,
    nameSimilarity,
    developer,
    zone,
    distanceKm,
  };
}

function isStrongMatch(candidate) {
  if (!candidate) return false;
  if (
    candidate.exactName &&
    (
      candidate.developer >= 0.56 ||
      candidate.zone >= 1 ||
      (candidate.distanceKm !== null && candidate.distanceKm <= 1)
    )
  ) {
    return true;
  }
  if (
    candidate.canonicalName &&
    candidate.developer >= 0.72 &&
    (
      candidate.zone >= 0.6 ||
      (candidate.distanceKm !== null && candidate.distanceKm <= 3)
    )
  ) {
    return true;
  }
  if (
    candidate.nameSimilarity >= 0.94 &&
    candidate.developer >= 0.82 &&
    (
      candidate.zone >= 0.6 ||
      (candidate.distanceKm !== null && candidate.distanceKm <= 4)
    )
  ) {
    return true;
  }
  return Boolean(
    candidate.distanceKm !== null &&
      candidate.distanceKm <= 0.6 &&
      candidate.nameSimilarity >= 0.85 &&
      candidate.developer >= 0.5,
  );
}

function isAmbiguous(best, second) {
  if (!best || !second) return false;
  if (best.observation.sourceId === second.observation.sourceId) return false;
  if (best.observation.name === second.observation.name) return false;
  return best.score - second.score < 0.025;
}

function matchTokens(value) {
  return [...new Set(words(canonicalProjectName(value)).filter((word) => word.length >= 3))];
}

function createObservationIndex(observations) {
  const bySource = new Map();
  for (const observation of observations || []) {
    if (!observation?.source || !Number.isFinite(Number(observation.priceMin))) continue;
    let index = bySource.get(observation.source);
    if (!index) {
      index = { observations: [], byToken: new Map() };
      bySource.set(observation.source, index);
    }
    index.observations.push(observation);
    matchTokens(observation.name).forEach((token) => {
      const candidates = index.byToken.get(token) || [];
      candidates.push(observation);
      index.byToken.set(token, candidates);
    });
  }
  return bySource;
}

function sourceIndex(observations) {
  if (!(observations instanceof Map)) return createObservationIndex(observations);
  const values = [...observations.values()];
  if (values.every((value) => value?.byToken instanceof Map)) return observations;
  return createObservationIndex(values.flat());
}

function matchingCandidates(index, project) {
  const candidates = new Set();
  matchTokens(project?.name).forEach((token) => {
    (index.byToken.get(token) || []).forEach((observation) => candidates.add(observation));
  });
  return [...candidates];
}

function findProjectMatches(project, observations) {
  const bySource = sourceIndex(observations);

  const matches = [];
  const skippedSources = [];
  bySource.forEach((index, source) => {
    const ranked = matchingCandidates(index, project)
      .map((observation) => scoreCandidate(project, observation))
      .sort((left, right) => right.score - left.score);
    const best = ranked[0];
    if (!isStrongMatch(best) || isAmbiguous(best, ranked[1])) {
      skippedSources.push({ source, best });
      return;
    }
    matches.push(best);
  });

  return { matches, skippedSources };
}

function sourceSummary(match) {
  const observation = match.observation;
  return {
    name: observation.source,
    url: observation.url,
    observedPrice: Math.round(Number(observation.priceMin)),
    sourceId: observation.sourceId,
  };
}

function summarizeMatches(matches) {
  if (!matches.length) return null;
  const sorted = [...matches].sort(
    (left, right) => Number(left.observation.priceMin) - Number(right.observation.priceMin),
  );
  const bestPrice = Math.round(Number(sorted[0].observation.priceMin));
  const enrichment = [...matches]
    .sort(
      (left, right) =>
        (Number(right.observation.priority) || 0) -
        (Number(left.observation.priority) || 0),
    )
    .find((match) => match.observation.enrichment)?.observation.enrichment;

  return {
    priceMin: bestPrice,
    confidence: matches.every((match) => match.score >= 0.95) ? 'high' : 'verified',
    sourceCount: matches.length,
    // Keep the source that supports the published starting price first. The UI
    // links to this entry, so it must not point to a higher comparison price.
    sources: sorted.map(sourceSummary),
    enrichment: enrichment || null,
  };
}

function relativeDifference(left, right) {
  const a = Number(left);
  const b = Number(right);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return Infinity;
  return Math.abs(a - b) / Math.max(a, b);
}

function shouldQuarantineChange(project, summary, pendingRecord, maxChange) {
  if (project?.priceMeta?.status !== 'verified') return false;
  const currentPrice = Number(project.priceMin);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return false;
  if (relativeDifference(currentPrice, summary.priceMin) <= maxChange) return false;
  if (summary.sourceCount >= 2) return false;

  return !(
    pendingRecord &&
    relativeDifference(pendingRecord.priceMin, summary.priceMin) <= 0.02 &&
    Number(pendingRecord.confirmations) >= 1
  );
}

function applyVerifiedPrice(project, summary, now) {
  const next = { ...project };
  const oldSources = JSON.stringify(project.priceMeta?.sources || []);
  const newSources = JSON.stringify(summary.sources);
  const priceChanged = Number(project.priceMin) !== summary.priceMin;
  const metadataChanged =
    project.priceMeta?.status !== 'verified' ||
    oldSources !== newSources ||
    project.priceMeta?.confidence !== summary.confidence;

  if (!priceChanged && !metadataChanged) return { project, changed: false };

  next.priceMin = summary.priceMin;
  delete next.priceMax;
  next.priceMeta = {
    status: 'verified',
    kind: 'starting-price',
    currency: 'EGP',
    confidence: summary.confidence,
    sourceCount: summary.sourceCount,
    sources: summary.sources,
    updatedAt: now,
  };

  const enrichment = summary.enrichment;
  if (enrichment) {
    if (Array.isArray(enrichment.unitTypes) && enrichment.unitTypes.length) {
      next.unitTypes = enrichment.unitTypes;
    }
    if (Number.isFinite(Number(enrichment.downPayment))) {
      next.downPayment = Number(enrichment.downPayment);
    }
    if (Number.isFinite(Number(enrichment.installmentYears))) {
      next.installmentYears = Number(enrichment.installmentYears);
    }
    if (enrichment.paymentPlan) next.paymentPlan = enrichment.paymentPlan;
  }

  return { project: next, changed: true };
}

module.exports = {
  applyVerifiedPrice,
  canonicalProjectName,
  createObservationIndex,
  developerSimilarity,
  findProjectMatches,
  normalizeDeveloper,
  normalizeProjectName,
  relativeDifference,
  scoreCandidate,
  shouldQuarantineChange,
  summarizeMatches,
  text,
  zoneSimilarity,
};
