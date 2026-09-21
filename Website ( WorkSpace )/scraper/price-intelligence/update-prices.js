'use strict';

const fs = require('fs');
const path = require('path');

const {
  applyVerifiedPrice,
  createObservationIndex,
  findProjectMatches,
  normalizeProjectName,
  relativeDifference,
  shouldQuarantineChange,
  summarizeMatches,
} = require('./core');
const { collectSources } = require('./sources');

const WEBSITE_ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(WEBSITE_ROOT, 'data.json');
const STATE_PATH = path.join(__dirname, 'state.json');
const STATUS_PATH = path.join(WEBSITE_ROOT, 'price-status.json');
const CONFIG_PATH = path.join(__dirname, 'config.json');

const ZONE_FILES = {
  northCoast: path.join(WEBSITE_ROOT, 'north_coast.json'),
  sokhna: path.join(WEBSITE_ROOT, 'sokhna.json'),
  cairo: path.join(WEBSITE_ROOT, 'cairo.json'),
  gouna: path.join(WEBSITE_ROOT, 'gouna.json'),
  others: path.join(WEBSITE_ROOT, 'others.json'),
};

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, filePath);
}

function parseArgs(argv) {
  const options = {
    mode: 'hourly',
    dryRun: false,
    json: false,
  };
  for (const argument of argv) {
    if (argument === '--dry-run') options.dryRun = true;
    if (argument === '--json') options.json = true;
    if (argument.startsWith('--mode=')) {
      const mode = argument.slice('--mode='.length);
      if (mode === 'hourly' || mode === 'daily') options.mode = mode;
      else throw new Error('Invalid mode');
    }
  }
  return options;
}

function projectKey(project, index) {
  const lat = Number(project?.lat);
  const lng = Number(project?.lng);
  const location =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? `${lat.toFixed(5)},${lng.toFixed(5)}`
      : String(index);
  return `${normalizeProjectName(project?.name)}|${location}`;
}

function safeState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { schemaVersion: 1, pending: {} };
  }
  return {
    schemaVersion: 1,
    pending:
      value.pending && typeof value.pending === 'object' && !Array.isArray(value.pending)
        ? value.pending
        : {},
  };
}

function sourceIds(summary) {
  return (summary.freshSources || summary.sources)
    .map((source) => source.sourceId)
    .sort();
}

function isRecent(timestamp, now, maximumHours) {
  const then = new Date(timestamp).getTime();
  const current = new Date(now).getTime();
  return (
    Number.isFinite(then) &&
    Number.isFinite(current) &&
    current >= then &&
    current - then <= maximumHours * 60 * 60 * 1000
  );
}

function mergeRetainedSources(project, summary, activeSourceNames, now, maximumHours) {
  if (!summary || project?.priceMeta?.status !== 'verified') return summary;
  if (!isRecent(project.priceMeta.updatedAt, now, maximumHours)) return summary;

  const freshSources = summary.sources || [];
  const freshIds = new Set(freshSources.map((source) => source.sourceId));
  const retained = (project.priceMeta.sources || []).filter((source) => {
    const observedPrice = Number(source?.observedPrice);
    return (
      source?.name &&
      source?.sourceId &&
      !activeSourceNames.has(source.name) &&
      !freshIds.has(source.sourceId) &&
      Number.isFinite(observedPrice) &&
      observedPrice > 0
    );
  });
  if (!retained.length) return summary;

  const sources = [...freshSources, ...retained].sort(
    (left, right) => Number(left.observedPrice) - Number(right.observedPrice),
  );
  return {
    ...summary,
    priceMin: Number(sources[0].observedPrice),
    sourceCount: sources.length,
    freshSourceCount: freshSources.length,
    freshSources,
    confidence:
      project.priceMeta.confidence === 'high' && summary.confidence === 'high'
        ? 'high'
        : 'verified',
    sources,
  };
}

function recordPendingChange(pending, key, summary, now) {
  const previous = pending[key];
  const sameCandidate =
    previous && relativeDifference(previous.priceMin, summary.priceMin) <= 0.02;
  pending[key] = {
    priceMin: summary.priceMin,
    sourceIds: sourceIds(summary),
    confirmations: sameCandidate ? Number(previous.confirmations || 0) + 1 : 1,
    firstSeenAt: sameCandidate ? previous.firstSeenAt : now,
    lastSeenAt: now,
  };
}

function clearExpiredPending(pending, now) {
  const cutoff = new Date(now).getTime() - 7 * 24 * 60 * 60 * 1000;
  let changed = false;
  Object.entries(pending).forEach(([key, entry]) => {
    if (!entry?.lastSeenAt || new Date(entry.lastSeenAt).getTime() < cutoff) {
      delete pending[key];
      changed = true;
    }
  });
  return changed;
}

function selectZoneFile(zone) {
  const normalized = String(zone || '').toLowerCase();
  if (/north coast|sahel|ras el hekma|sidi abdel rahman|alamein/.test(normalized)) {
    return 'northCoast';
  }
  if (/sokhna|galala|zaafarana/.test(normalized)) return 'sokhna';
  if (/gouna|hurghada|red sea|soma bay|sahl hasheesh/.test(normalized)) return 'gouna';
  if (
    /cairo|capital|october|zayed|shorouk|mostakbal|madinaty|obour|heliopolis/.test(
      normalized,
    )
  ) {
    return 'cairo';
  }
  return 'others';
}

function createZoneData(masterData) {
  const output = {
    northCoast: { projects: [], projectDetails: {} },
    sokhna: { projects: [], projectDetails: {} },
    cairo: { projects: [], projectDetails: {} },
    gouna: { projects: [], projectDetails: {} },
    others: { projects: [], projectDetails: {} },
  };
  const projectDetails = masterData.projectDetails || {};
  for (const project of masterData.projects || []) {
    const key = selectZoneFile(project.zone);
    output[key].projects.push(project);
    if (projectDetails[project.name]) {
      output[key].projectDetails[project.name] = projectDetails[project.name];
    }
  }
  return output;
}

function countVerified(projects) {
  return projects.filter((project) => project?.priceMeta?.status === 'verified').length;
}

function createStatus(now, mode, sourceResults, projects, run) {
  return {
    schemaVersion: 1,
    lastPublishedAt: now,
    mode,
    verifiedProjects: countVerified(projects),
    totalProjects: projects.length,
    sourceCoverage: sourceResults.map((result) => ({
      source: result.source,
      ok: result.ok,
      observations: result.observations.length,
    })),
    lastPublication: {
      updatedProjects: run.updatedProjects,
      quarantinedProjects: run.quarantinedProjects,
      unmatchedProjects: run.unmatchedProjects,
    },
    note: 'Prices are verified starting prices from public source inventories. A missing verification is never treated as a current price.',
  };
}

function appendGithubSummary(summary) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const sourceRows = summary.sources
    .map(
      (source) => `| ${source.source} | ${source.ok ? 'OK' : 'Unavailable'} | ${source.observations} |`,
    )
    .join('\n');
  const output = [
    '## Property Explorer price intelligence',
    '',
    `Mode: **${summary.mode}**${summary.dryRun ? ' (dry run)' : ''}`,
    '',
    '| Source | Status | Valid price observations |',
    '| --- | --- | ---: |',
    sourceRows,
    '',
    `- Updated projects: ${summary.updatedProjects}`,
    `- Verified projects: ${summary.verifiedProjects}`,
    `- Quarantined abnormal changes: ${summary.quarantinedProjects}`,
    `- Unmatched projects: ${summary.unmatchedProjects}`,
    '',
  ].join('\n');
  fs.appendFileSync(summaryPath, output, 'utf8');
}

async function run(options) {
  const config = readJson(CONFIG_PATH);
  const data = readJson(DATA_PATH);
  if (!config || !data || !Array.isArray(data.projects)) {
    throw new Error('Price intelligence configuration is unavailable');
  }

  const now = process.env.PRICE_INTELLIGENCE_NOW || new Date().toISOString();
  const sourceResults = await collectSources(config, options.mode);
  const successfulSources = sourceResults.filter((result) => result.ok);
  const observations = successfulSources.flatMap((result) => result.observations);
  if (!successfulSources.length || observations.length < 20) {
    throw new Error('No safe source inventory was available');
  }

  const observationsBySource = createObservationIndex(observations);
  const activeSourceNames = new Set(observations.map((observation) => observation.source));
  const state = safeState(readJson(STATE_PATH, { schemaVersion: 1, pending: {} }));
  const originalState = JSON.stringify(state);
  const nextProjects = [];
  const runSummary = {
    mode: options.mode,
    dryRun: options.dryRun,
    sources: sourceResults.map((result) => ({
      source: result.source,
      ok: result.ok,
      observations: result.observations.length,
    })),
    updatedProjects: 0,
    quarantinedProjects: 0,
    unmatchedProjects: 0,
    lowConfidenceProjects: 0,
    verifiedProjects: 0,
  };

  data.projects.forEach((project, index) => {
    const key = projectKey(project, index);
    const { matches, skippedSources } = findProjectMatches(project, observationsBySource);
    const freshSummary = summarizeMatches(matches);
    const summary =
      options.mode === 'hourly'
        ? mergeRetainedSources(
            project,
            freshSummary,
            activeSourceNames,
            now,
            Number(config.retainDailySourceHours) || 36,
          )
        : freshSummary;
    if (!summary) {
      runSummary.unmatchedProjects += 1;
      if (skippedSources.length) runSummary.lowConfidenceProjects += 1;
      nextProjects.push(project);
      return;
    }

    const pending = state.pending[key];
    if (
      shouldQuarantineChange(
        project,
        summary,
        pending,
        Number(config.maxVerifiedChangeWithoutReview) || 0.35,
      )
    ) {
      recordPendingChange(state.pending, key, summary, now);
      runSummary.quarantinedProjects += 1;
      nextProjects.push(project);
      return;
    }

    delete state.pending[key];
    const applied = applyVerifiedPrice(project, summary, now);
    if (applied.changed) runSummary.updatedProjects += 1;
    nextProjects.push(applied.project);
  });

  clearExpiredPending(state.pending, now);
  runSummary.verifiedProjects = countVerified(nextProjects);
  const dataChanged = JSON.stringify(data.projects) !== JSON.stringify(nextProjects);
  const stateChanged = originalState !== JSON.stringify(state);

  if (!options.dryRun) {
    if (dataChanged) {
      const nextData = { ...data, projects: nextProjects };
      writeJsonAtomic(DATA_PATH, nextData);
      const zoneData = createZoneData(nextData);
      Object.entries(ZONE_FILES).forEach(([key, filePath]) => {
        writeJsonAtomic(filePath, zoneData[key]);
      });
      writeJsonAtomic(
        STATUS_PATH,
        createStatus(now, options.mode, sourceResults, nextProjects, runSummary),
      );
    }
    if (stateChanged) writeJsonAtomic(STATE_PATH, state);
  }

  return {
    ...runSummary,
    dataChanged,
    stateChanged,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await run(options);
  appendGithubSummary(summary);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(summary)}\n`);
  } else {
    console.log(
      `Price intelligence ${summary.mode}: ${summary.updatedProjects} updated, ${summary.verifiedProjects} verified, ${summary.quarantinedProjects} quarantined.`,
    );
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('Property price intelligence stopped safely; no unverified data was published.');
    process.exitCode = 1;
  });
}

module.exports = {
  createZoneData,
  mergeRetainedSources,
  parseArgs,
  projectKey,
  run,
  selectZoneFile,
};
