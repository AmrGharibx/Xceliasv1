'use strict';

const {
  canonicalProjectName,
  createObservationIndex,
  findProjectMatches,
  normalizeDeveloper,
  zoneSimilarity,
} = require('../price-intelligence/core');

function isSafeImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function hasProjectImage(details) {
  return Array.isArray(details?.images) && details.images.some(isSafeImageUrl);
}

function isValidCoordinate(value, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum;
}

function normalizeUnitTypes(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

function inferProjectType(unitTypes) {
  const commercialTerms = /office|administrative|retail|clinic|medical|commercial|shop|mall/i;
  const types = normalizeUnitTypes(unitTypes);
  return types.length && types.every((type) => commercialTerms.test(type))
    ? 'commercial'
    : 'residential';
}

function validInventoryRecord(record) {
  return Boolean(
    record &&
      record.sourceId &&
      String(record.name || '').trim() &&
      String(record.developer || '').trim() &&
      String(record.zone || '').trim() &&
      isValidCoordinate(record.lat, 20, 34) &&
      isValidCoordinate(record.lng, 24, 38) &&
      isSafeImageUrl(record.imageUrl),
  );
}

function inventoryObservation(record) {
  return {
    source: 'Nawy inventory',
    sourceId: record.sourceId,
    name: record.name,
    developer: record.developer,
    zone: record.zone,
    lat: Number(record.lat),
    lng: Number(record.lng),
    // The matching index requires a finite number. This is never published as
    // a verified price by the catalogue pipeline.
    priceMin: Number(record.priceMin) || 0,
  };
}

function candidateKey(project) {
  return canonicalProjectName(project?.name);
}

function createCanonicalProjectIndex(projects) {
  const byName = new Map();
  (projects || []).forEach((project, index) => {
    const key = candidateKey(project);
    if (!key) return;
    const candidates = byName.get(key) || [];
    candidates.push({ project, index });
    byName.set(key, candidates);
  });
  return byName;
}

function findExactFallback(record, byName) {
  const candidates = byName.get(candidateKey(record)) || [];
  if (!candidates.length) return null;
  const developer = normalizeDeveloper(record.developer);
  const developerMatches = candidates.filter(
    ({ project }) => normalizeDeveloper(project.dev || project.developer) === developer,
  );
  if (developerMatches.length === 1) return developerMatches[0].index;

  const zoneMatches = candidates.filter(({ project }) => {
    return zoneSimilarity(project.zone, record.zone) >= 1;
  });
  if (zoneMatches.length === 1) return zoneMatches[0].index;
  return null;
}

/**
 * Match current inventory rows to existing records. Strong scored matching is
 * preferred; exact canonical names are only a conservative fallback so renamed
 * or similarly named projects never create a silent duplicate.
 */
function matchInventoryToProjects(projects, inventory) {
  const records = (inventory || []).filter(validInventoryRecord);
  const observations = records.map(inventoryObservation);
  const observationIndex = createObservationIndex(observations);
  const recordById = new Map(records.map((record) => [record.sourceId, record]));
  const matches = new Map();

  (projects || []).forEach((project, projectIndex) => {
    const { matches: candidates } = findProjectMatches(project, observationIndex);
    candidates.forEach((candidate) => {
      const sourceId = candidate.observation.sourceId;
      const existing = matches.get(sourceId);
      if (!existing || candidate.score > existing.score) {
        matches.set(sourceId, { projectIndex, score: candidate.score });
      }
    });
  });

  const byName = createCanonicalProjectIndex(projects);
  records.forEach((record) => {
    if (matches.has(record.sourceId)) return;
    const projectIndex = findExactFallback(record, byName);
    if (projectIndex !== null) matches.set(record.sourceId, { projectIndex, score: 1 });
  });

  return {
    matches,
    records,
    recordById,
  };
}

function formatPaymentPlan(record) {
  if (record.paymentPlan) return record.paymentPlan;
  const parts = [];
  if (Number.isFinite(Number(record.downPayment))) {
    parts.push(`${Number(record.downPayment)}% Down Payment`);
  }
  if (Number.isFinite(Number(record.installmentYears))) {
    parts.push(`${Number(record.installmentYears)} Years Installments`);
  }
  return parts.join(', ');
}

function createProjectDetails(record) {
  const unitTypes = normalizeUnitTypes(record.unitTypes);
  return {
    unitTypes: unitTypes.join(', '),
    areas: '',
    paymentPlan: formatPaymentPlan(record),
    status: 'Available',
    amenities: '',
    description: 'Project information is being verified.',
    masterplan: '',
    layouts: [],
    images: [record.imageUrl],
  };
}

function createProjectRecord(record, observedAt) {
  const unitTypes = normalizeUnitTypes(record.unitTypes);
  const project = {
    name: record.name,
    dev: record.developer,
    lat: Number(record.lat),
    lng: Number(record.lng),
    zone: record.zone,
    status: 'Available',
    type: inferProjectType(unitTypes),
    unitTypes,
    downPayment: Number.isFinite(Number(record.downPayment))
      ? Number(record.downPayment)
      : undefined,
    installmentYears: Number.isFinite(Number(record.installmentYears))
      ? Number(record.installmentYears)
      : undefined,
    paymentPlan: formatPaymentPlan(record),
    catalogMeta: {
      status: 'observed',
      sourceId: record.sourceId,
      observedAt,
    },
  };

  if (Number.isFinite(Number(record.priceMin)) && Number(record.priceMin) > 0) {
    project.priceMin = Math.round(Number(record.priceMin));
  }

  Object.keys(project).forEach((key) => {
    if (project[key] === undefined || project[key] === '') delete project[key];
  });
  return project;
}

function applyInventory(data, inventory, observedAt) {
  const currentProjects = Array.isArray(data?.projects) ? data.projects : [];
  const currentDetails = data?.projectDetails && typeof data.projectDetails === 'object'
    ? data.projectDetails
    : {};
  const nextProjects = [...currentProjects];
  const nextDetails = { ...currentDetails };
  const { matches, records, recordById } = matchInventoryToProjects(
    currentProjects,
    inventory,
  );
  const matchedProjectIndexes = new Set();
  let imagesAdded = 0;
  let detailsCreated = 0;

  matches.forEach(({ projectIndex }, sourceId) => {
    const project = currentProjects[projectIndex];
    const record = recordById.get(sourceId);
    if (!project || !record) return;
    matchedProjectIndexes.add(projectIndex);

    const details = nextDetails[project.name];
    if (!details) {
      nextDetails[project.name] = createProjectDetails(record);
      detailsCreated += 1;
    } else if (!hasProjectImage(details)) {
      nextDetails[project.name] = { ...details, images: [record.imageUrl] };
      imagesAdded += 1;
    }
  });

  let projectsAdded = 0;
  records.forEach((record) => {
    if (matches.has(record.sourceId)) return;
    const project = createProjectRecord(record, observedAt);
    nextProjects.push(project);
    nextDetails[project.name] = createProjectDetails(record);
    projectsAdded += 1;
  });

  const missingPhotos = nextProjects.filter(
    (project) => !hasProjectImage(nextDetails[project.name]),
  ).length;

  return {
    data: { ...data, projects: nextProjects, projectDetails: nextDetails },
    summary: {
      sourceRecords: records.length,
      matchedExistingProjects: matchedProjectIndexes.size,
      projectsAdded,
      imagesAdded,
      detailsCreated,
      totalProjects: nextProjects.length,
      missingPhotos,
    },
  };
}

function catalogueHealth(data) {
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const details = data?.projectDetails && typeof data.projectDetails === 'object'
    ? data.projectDetails
    : {};
  const projectsWithDetails = projects.filter((project) => details[project.name]).length;
  const projectsWithImages = projects.filter((project) => hasProjectImage(details[project.name])).length;
  const directMasterplans = projects.filter((project) => {
    return isSafeImageUrl(details[project.name]?.masterplan);
  }).length;
  const directLayouts = projects.filter((project) => {
    return Array.isArray(details[project.name]?.layouts) &&
      details[project.name].layouts.some(isSafeImageUrl);
  }).length;
  const referenceMasterplans = projects.filter((project) => {
    const value = details[project.name]?.masterplan;
    return typeof value === 'string' && value.trim() && !isSafeImageUrl(value);
  }).length;
  const referenceLayouts = projects.filter((project) => {
    const values = details[project.name]?.layouts;
    return Array.isArray(values) && values.some((value) => typeof value === 'string' && value.trim() && !isSafeImageUrl(value));
  }).length;

  return {
    totalProjects: projects.length,
    projectsWithDetails,
    projectsWithImages,
    missingPhotos: projects.length - projectsWithImages,
    directMasterplans,
    directLayouts,
    referenceMasterplans,
    referenceLayouts,
  };
}

module.exports = {
  applyInventory,
  catalogueHealth,
  createProjectDetails,
  createProjectRecord,
  hasProjectImage,
  inferProjectType,
  isSafeImageUrl,
  matchInventoryToProjects,
  validInventoryRecord,
};
