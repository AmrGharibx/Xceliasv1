'use strict';

const fs = require('fs');
const path = require('path');

const { createRequester } = require('../price-intelligence/sources');
const { createZoneData } = require('../price-intelligence/update-prices');
const {
  applyReferenceAssets,
  extractReferenceAssets,
  projectReferencePages,
} = require('./core');

const WEBSITE_ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(WEBSITE_ROOT, 'data.json');
const CONFIG_PATH = path.join(WEBSITE_ROOT, 'scraper', 'price-intelligence', 'config.json');
const STATUS_PATH = path.join(WEBSITE_ROOT, 'reference-asset-status.json');
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
    evidence: argv.includes('--evidence'),
  };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function fetchReferences(pages, config) {
  const requester = createRequester({ ...config, timeoutMs: 12000 });
  let failed = 0;
  const records = await mapWithConcurrency(pages, 4, async (page) => {
    try {
      const host = new URL(page.url).hostname;
      const html = await requester.html(`reference-assets:${host}`, page.url, {
        minimumDelayMs: 850,
      });
      return { projectName: page.projectName, url: page.url, ...extractReferenceAssets(page.projectName, html, page.url) };
    } catch {
      failed += 1;
      return { projectName: page.projectName, url: page.url, matchedProject: false, coverImage: '', masterplans: [], layouts: [] };
    }
  });
  return { records, failed };
}

function createStatus(now, pages, fetched, summary, applied) {
  const matchedPages = fetched.records.filter((record) => record.matchedProject).length;
  return {
    schemaVersion: 1,
    lastPublishedAt: now,
    referencePages: pages.length,
    matchedPages,
    failedPages: fetched.failed,
    publication: { ...summary, applied },
    note: 'Only explicit masterplan, site-plan, floor-plan, layout image/PDF links are published. A page cover image is used only when its title matches the linked project.',
  };
}

async function run(options = {}) {
  const config = readJson(CONFIG_PATH);
  const currentData = readJson(DATA_PATH);
  const now = process.env.REFERENCE_ASSET_INTELLIGENCE_NOW || new Date().toISOString();
  const pages = projectReferencePages(currentData);
  const fetched = await fetchReferences(pages, config);
  const applied = applyReferenceAssets(currentData, fetched.records, now);
  const summary = { ...applied.summary, failedPages: fetched.failed, applied: Boolean(options.apply) };

  if (options.apply) {
    writeJsonAtomic(DATA_PATH, applied.data);
    const zoneData = createZoneData(applied.data);
    Object.entries(ZONE_FILES).forEach(([key, filePath]) => {
      writeJsonAtomic(filePath, zoneData[key]);
    });
    writeJsonAtomic(STATUS_PATH, createStatus(now, pages, fetched, applied.summary, true));
  }
  const evidence = fetched.records
    .filter(
      (record) =>
        record.matchedProject &&
        (record.coverImage || record.masterplans.length || record.layouts.length),
    )
    .map((record) => ({
      projectName: record.projectName,
      url: record.url,
      coverImage: record.coverImage,
      masterplans: record.masterplans,
      layouts: record.layouts,
    }));
  return { ...summary, pages: pages.length, evidence: options.evidence ? evidence : undefined };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await run(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } else {
    console.log(`Reference asset audit: ${result.layoutsAdded} layouts and ${result.masterplansAdded} masterplans added.`);
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('Reference asset intelligence stopped safely; no project assets were published.');
    process.exitCode = 1;
  });
}

module.exports = { createStatus, fetchReferences, mapWithConcurrency, parseArgs, run };
