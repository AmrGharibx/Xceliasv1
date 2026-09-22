'use strict';

const {
  canonicalProjectName,
  createObservationIndex,
  findProjectMatches,
  normalizeDeveloper,
  scoreCandidate,
  zoneSimilarity,
} = require('../price-intelligence/core');
const { hasProjectImage, isSafeImageUrl } = require('../catalog-intelligence/core');

function isHttpsReference(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function directImages(values) {
  const candidates = Array.isArray(values) ? values : [values];
  return [
    ...new Set(
      candidates
        .map((item) => (item && typeof item === 'object' ? item.url || item.image : item))
        .filter(isSafeImageUrl),
    ),
  ];
}

function references(values) {
  const candidates = Array.isArray(values) ? values : [values];
  return [
    ...new Set(
      candidates
        .map((item) => (item && typeof item === 'object' ? item.url || item.image : item))
        .filter((value) => isHttpsReference(value) && !isSafeImageUrl(value)),
    ),
  ];
}

function preserveReferences(details, field, values) {
  const preserved = references(values);
  if (!preserved.length) return details;
  const current = Array.isArray(details.assetReferences?.[field])
    ? details.assetReferences[field]
    : [];
  return {
    ...details,
    assetReferences: {
      ...(details.assetReferences || {}),
      [field]: [...new Set([...current, ...preserved])],
    },
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

function isBetterAssetMatch(candidate, current) {
  if (!current) return true;
  if (candidate.score !== current.score) return candidate.score > current.score;
  if (candidate.exactName !== current.exactName) return candidate.exactName;
  if (candidate.canonicalName !== current.canonicalName) return candidate.canonicalName;
  const candidateDistance = Number.isFinite(candidate.distanceKm)
    ? candidate.distanceKm
    : Infinity;
  const currentDistance = Number.isFinite(current.distanceKm) ? current.distanceKm : Infinity;
  return candidateDistance < currentDistance;
}

/**
 * A source row may resemble several historical records. Assign it to only its
 * strongest candidate so one image or masterplan never leaks across projects.
 */
function matchAssetInventory(projects, inventory) {
  const index = createObservationIndex(inventory || []);
  const matchesBySource = new Map();
  (projects || []).forEach((project, projectIndex) => {
    const { matches } = findProjectMatches(project, index);
    matches.forEach((match) => {
      const sourceId = match.observation.sourceId;
      const current = matchesBySource.get(sourceId);
      if (!current || isBetterAssetMatch(match, current.match)) {
        matchesBySource.set(sourceId, { projectIndex, match });
      }
    });
  });
  return matchesBySource;
}

function findStrongAssetAlias(target, projects, detailsByProject) {
  const targetName = canonicalProjectName(target?.name);
  const targetDeveloper = normalizeDeveloper(target?.dev || target?.developer);
  if (!targetName || !targetDeveloper || targetDeveloper === 'unknown') return null;

  let best = null;
  (projects || []).forEach((candidate) => {
    if (!candidate || candidate.name === target.name) return;
    if (canonicalProjectName(candidate.name) !== targetName) return;
    if (normalizeDeveloper(candidate.dev || candidate.developer) !== targetDeveloper) return;
    if (zoneSimilarity(candidate.zone, target.zone) < 1) return;
    if (!hasProjectImage(detailsByProject[candidate.name])) return;
    const distanceKm = scoreCandidate(target, candidate).distanceKm;
    if (distanceKm === null || distanceKm > 0.75) return;
    if (!best || distanceKm < best.distanceKm) {
      best = { project: candidate, details: detailsByProject[candidate.name], distanceKm };
    }
  });
  return best;
}

function inheritStrongAliasAssets(projects, detailsByProject, observedAt) {
  let imagesInherited = 0;
  let masterplansInherited = 0;
  (projects || []).forEach((project) => {
    const current = detailsByProject[project.name] || emptyDetails();
    if (hasProjectImage(current)) return;
    const alias = findStrongAssetAlias(project, projects, detailsByProject);
    if (!alias) return;

    const images = directImages(alias.details.images);
    if (!images.length) return;
    let details = { ...current, images };
    imagesInherited += 1;
    if (!isSafeImageUrl(details.masterplan) && isSafeImageUrl(alias.details.masterplan)) {
      details = preserveReferences(details, 'masterplan', details.masterplan);
      details.masterplan = alias.details.masterplan;
      masterplansInherited += 1;
    }
    detailsByProject[project.name] = {
      ...details,
      assetMeta: {
        ...(details.assetMeta || {}),
        lastAliasEnrichedAt: observedAt,
        aliasOf: alias.project.name,
      },
    };
  });
  return { imagesInherited, masterplansInherited };
}

/**
 * Apply only strongly matched, direct display assets. Page references are
 * retained for audit and future extraction but never masquerade as images.
 */
function applyAssetInventory(data, inventory, observedAt) {
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const currentDetails = data?.projectDetails && typeof data.projectDetails === 'object'
    ? data.projectDetails
    : {};
  const nextDetails = { ...currentDetails };
  const matchesBySource = matchAssetInventory(projects, inventory);
  let matchedProjects = 0;
  let imagesAdded = 0;
  let masterplansAdded = 0;
  let layoutsAdded = 0;
  let detailsCreated = 0;

  matchesBySource.forEach(({ projectIndex, match }) => {
    const project = projects[projectIndex];
    if (!project) return;
    matchedProjects += 1;

    const asset = match.observation;
    const incomingImages = directImages(asset.imageUrls);
    const incomingMasterplan = directImages(asset.masterplan)[0] || '';
    const incomingLayouts = directImages(asset.layouts);
    let details = nextDetails[project.name] || emptyDetails();
    let changed = !nextDetails[project.name];
    if (changed) detailsCreated += 1;

    if (!hasProjectImage(details) && incomingImages.length) {
      details = { ...details, images: incomingImages.slice(0, 8) };
      imagesAdded += 1;
      changed = true;
    }

    if (incomingMasterplan && !isSafeImageUrl(details.masterplan)) {
      details = preserveReferences(details, 'masterplan', details.masterplan);
      details = { ...details, masterplan: incomingMasterplan };
      masterplansAdded += 1;
      changed = true;
    }

    const currentDirectLayouts = directImages(details.layouts);
    if (!currentDirectLayouts.length && incomingLayouts.length) {
      details = preserveReferences(details, 'layouts', details.layouts);
      details = { ...details, layouts: incomingLayouts.slice(0, 12) };
      layoutsAdded += 1;
      changed = true;
    }

    if (changed) {
      nextDetails[project.name] = {
        ...details,
        assetMeta: {
          ...(details.assetMeta || {}),
          lastEnrichedAt: observedAt,
          sourceId: asset.sourceId,
        },
      };
    }
  });

  const aliasSummary = inheritStrongAliasAssets(projects, nextDetails, observedAt);
  const nextData = { ...data, projectDetails: nextDetails };
  return {
    data: nextData,
    summary: {
      matchedProjects,
      imagesAdded,
      masterplansAdded,
      layoutsAdded,
      detailsCreated,
      aliasImagesInherited: aliasSummary.imagesInherited,
      aliasMasterplansInherited: aliasSummary.masterplansInherited,
      missingPhotos: projects.filter((project) => !hasProjectImage(nextDetails[project.name])).length,
    },
  };
}

function assetHealth(data) {
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const details = data?.projectDetails || {};
  return {
    totalProjects: projects.length,
    projectsWithImages: projects.filter((project) => hasProjectImage(details[project.name])).length,
    projectsWithDirectMasterplans: projects.filter((project) =>
      isSafeImageUrl(details[project.name]?.masterplan),
    ).length,
    projectsWithDirectLayouts: projects.filter((project) =>
      directImages(details[project.name]?.layouts).length > 0,
    ).length,
  };
}

module.exports = {
  applyAssetInventory,
  assetHealth,
  directImages,
  findStrongAssetAlias,
  inheritStrongAliasAssets,
  isHttpsReference,
  matchAssetInventory,
  preserveReferences,
  references,
};
