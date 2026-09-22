'use strict';

const fs = require('fs');
const path = require('path');

const { collectNawyInventory } = require('../price-intelligence/sources');
const { createZoneData } = require('../price-intelligence/update-prices');
const { applyInventory, catalogueHealth } = require('./core');

const WEBSITE_ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(WEBSITE_ROOT, 'data.json');
const CONFIG_PATH = path.join(WEBSITE_ROOT, 'scraper', 'price-intelligence', 'config.json');
const STATUS_PATH = path.join(WEBSITE_ROOT, 'catalog-status.json');
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
  const options = { apply: false, json: false };
  for (const argument of argv) {
    if (argument === '--apply') options.apply = true;
    if (argument === '--dry-run') options.apply = false;
    if (argument === '--json') options.json = true;
  }
  return options;
}

function createStatus(now, inventoryResult, summary, health) {
  return {
    schemaVersion: 1,
    lastPublishedAt: now,
    inventory: {
      source: 'public active compound inventory',
      reportedTotal: inventoryResult.total,
      usableRecords: summary.sourceRecords,
    },
    publication: summary,
    health,
    note: 'New catalogue entries require a name, developer, Egyptian coordinates, and a direct image. Prices stay unpublished until the verified-price monitor confirms them.',
  };
}

async function run(options = {}) {
  const config = readJson(CONFIG_PATH);
  const currentData = readJson(DATA_PATH);
  const now = process.env.CATALOG_INTELLIGENCE_NOW || new Date().toISOString();
  const inventoryResult = await collectNawyInventory(config);
  if (!inventoryResult.ok || !inventoryResult.observations.length) {
    throw new Error('Catalogue inventory was unavailable; no changes were published');
  }

  const applied = applyInventory(currentData, inventoryResult.observations, now);
  const health = catalogueHealth(applied.data);
  const summary = {
    ...applied.summary,
    inventoryReportedTotal: inventoryResult.total,
    applied: Boolean(options.apply),
  };

  if (options.apply) {
    writeJsonAtomic(DATA_PATH, applied.data);
    const zoneData = createZoneData(applied.data);
    Object.entries(ZONE_FILES).forEach(([key, filePath]) => {
      writeJsonAtomic(filePath, zoneData[key]);
    });
    writeJsonAtomic(STATUS_PATH, createStatus(now, inventoryResult, summary, health));
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
      `Catalogue ${options.apply ? 'sync' : 'audit'}: ${result.projectsAdded} added, ${result.imagesAdded} images added, ${result.missingPhotos} still awaiting imagery.`,
    );
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('Catalogue intelligence stopped safely; no catalogue changes were published.');
    process.exitCode = 1;
  });
}

module.exports = { createStatus, parseArgs, run };
