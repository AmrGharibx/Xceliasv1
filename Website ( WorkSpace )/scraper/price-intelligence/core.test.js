'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyVerifiedPrice,
  findProjectMatches,
  normalizeDeveloper,
  normalizeProjectName,
  shouldQuarantineChange,
  summarizeMatches,
} = require('./core');

function observation(overrides = {}) {
  return {
    source: 'Nawy',
    sourceId: 'nawy:1',
    priority: 100,
    name: 'ZED East Compound',
    developer: 'ORA Developers',
    zone: 'New Cairo',
    lat: 30.02,
    lng: 31.71,
    priceMin: 10000000,
    url: 'https://www.nawy.com/compound/zed-east',
    ...overrides,
  };
}

test('normalizes project and developer aliases before comparison', () => {
  assert.equal(normalizeProjectName('ZED East Compound'), 'zed east');
  assert.equal(normalizeDeveloper('Sixth of October Development and Investment Company'), 'sodic');
  assert.equal(normalizeDeveloper('Sodic'), 'sodic');
});

test('accepts a strong exact project match and retains the source evidence', () => {
  const project = {
    name: 'ZED East',
    dev: 'ORA',
    zone: 'New Cairo',
    lat: 30.02,
    lng: 31.71,
  };
  const { matches, skippedSources } = findProjectMatches(project, [observation()]);
  const summary = summarizeMatches(matches);

  assert.equal(skippedSources.length, 0);
  assert.equal(matches.length, 1);
  assert.equal(summary.priceMin, 10000000);
  assert.equal(summary.sources[0].name, 'Nawy');
});

test('puts the source that supports the published starting price first', () => {
  const summary = summarizeMatches([
    { score: 1, observation: observation({ priceMin: 12000000 }) },
    {
      score: 1,
      observation: observation({
        source: 'Property Finder',
        sourceId: 'property-finder:1',
        priceMin: 9500000,
        url: 'https://www.propertyfinder.eg/en/new-projects/zed-east',
      }),
    },
  ]);

  assert.equal(summary.priceMin, 9500000);
  assert.equal(summary.sources[0].name, 'Property Finder');
  assert.equal(summary.sources[0].observedPrice, 9500000);
});

test('does not accept a superficially similar project with contradictory evidence', () => {
  const project = {
    name: 'ZED West',
    dev: 'ORA',
    zone: 'Sheikh Zayed',
    lat: 30.04,
    lng: 30.98,
  };
  const wrongObservation = observation({
    name: 'ZED East Compound',
    developer: 'Palm Hills',
    zone: 'New Cairo',
    lat: 30.02,
    lng: 31.71,
  });
  const { matches } = findProjectMatches(project, [wrongObservation]);

  assert.equal(matches.length, 0);
});

test('quarantines a large single-source change until it appears again', () => {
  const project = {
    priceMin: 10000000,
    priceMeta: { status: 'verified' },
  };
  const summary = {
    priceMin: 5000000,
    sourceCount: 1,
    sources: [{ sourceId: 'nawy:1' }],
  };

  assert.equal(shouldQuarantineChange(project, summary, null, 0.35), true);
  assert.equal(
    shouldQuarantineChange(
      project,
      summary,
      { priceMin: 5000000, confirmations: 1 },
      0.35,
    ),
    false,
  );
  assert.equal(
    shouldQuarantineChange(project, { ...summary, sourceCount: 2 }, null, 0.35),
    false,
  );
});

test('publishes only a verified starting price and removes an invented range', () => {
  const project = {
    name: 'ZED East',
    priceMin: 8000000,
    priceMax: 12000000,
  };
  const summary = {
    priceMin: 10000000,
    confidence: 'high',
    sourceCount: 1,
    sources: [
      {
        name: 'Nawy',
        sourceId: 'nawy:1',
        observedPrice: 10000000,
        url: 'https://www.nawy.com/compound/zed-east',
      },
    ],
    enrichment: null,
  };
  const result = applyVerifiedPrice(project, summary, '2026-09-21T12:00:00.000Z');

  assert.equal(result.changed, true);
  assert.equal(result.project.priceMin, 10000000);
  assert.equal('priceMax' in result.project, false);
  assert.equal(result.project.priceMeta.status, 'verified');
  assert.equal(result.project.priceMeta.kind, 'starting-price');
});
