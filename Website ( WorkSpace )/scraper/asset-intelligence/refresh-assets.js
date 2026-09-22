'use strict';

const fs = require('fs');
const path = require('path');

const {
  collectPropertyFinderAssetInventory,
  collectRedAssetInventory,
} = require('../price-intelligence/sources');
const { createZoneData } = require('../price-intelligence/update-prices');
const { applyAssetInventory, assetHealth } = require('./core');

const WEBSITE_ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(WEBSITE_ROOT, 'data.json');
const CONFIG_PATH = path.join(WEBSITE_ROOT, 'scraper', 'price-intelligence', 'config.json');
const STATUS_PATH = path.join(WEBSITE_ROOT, 'asset-status.json');
const ZONE_FILES = {
  northCoast: path.join(WEBSITE_ROOT, 'north_coast.json'),
  sokhna: path.join(WEBSITE_ROOT, 'sokhna.json'),
  cairo: path.join(WEBSITE_ROOT, 'cairo.json'),
  gouna: path.join(WEBSITE_ROOT, 'gouna.json'),
  others: path.join(WEBSITE_ROOT, 'others.json'),
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonAtomic(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, filePath);
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
    json: argv.includes('--json'),
  };
}

function createStatus(now, sourceResults, summary, health) {
  return {
    schemaVersion: 1,
    lastPublishedAt: now,
    inventory: {
      source: 'public project-asset inventory',
      usableRecords: sourceResults.reduce(
        (total, sourceResult) => total + sourceResult.observations.length,
        0,
      ),
      sources: sourceResults.map((sourceResult) => ({
        source: sourceResult.source,
        ok: sourceResult.ok,
        observations: sourceResult.observations.length,
      })),
    },
    publication: summary,
    health,
    note: 'Only direct image assets from a strongly matched project are displayed. Source pages remain internal references until a specific masterplan or layout file can be verified.',
  };
}

async function run(options = {}) {
  const config = readJson(CONFIG_PATH);
  const currentData = readJson(DATA_PATH);
  const now = process.env.ASSET_INTELLIGENCE_NOW || new Date().toISOString();
  const sourceResults = await Promise.all([
    collectRedAssetInventory(config),
    ...(config?.sources?.propertyFinder?.enabled === false
      ? []
      : [collectPropertyFinderAssetInventory(config)]),
  ]);
  const observations = sourceResults.flatMap((sourceResult) => sourceResult.observations);
  if (!observations.length) {
    throw new Error('Project asset inventory was unavailable; no changes were published');
  }

  const applied = applyAssetInventory(currentData, observations, now);
  const health = assetHealth(applied.data);
  const summary = { ...applied.summary, applied: Boolean(options.apply) };

  if (options.apply) {
    writeJsonAtomic(DATA_PATH, applied.data);
    const zoneData = createZoneData(applied.data);
    Object.entries(ZONE_FILES).forEach(([key, filePath]) => {
      writeJsonAtomic(filePath, zoneData[key]);
    });
    writeJsonAtomic(STATUS_PATH, createStatus(now, sourceResults, summary, health));
  }

  return { ...summary, health };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await run(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } else {
    console.log(
      `Asset ${options.apply ? 'sync' : 'audit'}: ${result.imagesAdded} image sets and ${result.masterplansAdded} masterplans added.`,
    );
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('Asset intelligence stopped safely; no project assets were published.');
    process.exitCode = 1;
  });
}

module.exports = { createStatus, parseArgs, run };
