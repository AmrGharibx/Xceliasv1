'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldQuarantineChange } = require('./core');
const { mergeRetainedSources } = require('./update-prices');

const NOW = '2026-09-21T18:00:00.000Z';

test('fast refresh retains recent daily-only evidence without treating it as fresh confirmation', () => {
  const project = {
    priceMin: 9000000,
    priceMeta: {
      status: 'verified',
      confidence: 'verified',
      updatedAt: '2026-09-21T12:00:00.000Z',
      sources: [
        {
          name: 'Property Finder',
          sourceId: 'property-finder:1',
          observedPrice: 9000000,
          url: 'https://www.propertyfinder.eg/en/new-projects/example',
        },
      ],
    },
  };
  const freshSummary = {
    priceMin: 10000000,
    confidence: 'high',
    sourceCount: 1,
    sources: [
      {
        name: 'Nawy',
        sourceId: 'nawy:1',
        observedPrice: 10000000,
        url: 'https://www.nawy.com/compound/example',
      },
    ],
    enrichment: null,
  };

  const merged = mergeRetainedSources(
    project,
    freshSummary,
    new Set(['Nawy', 'RED']),
    NOW,
    36,
  );

  assert.equal(merged.priceMin, 9000000);
  assert.equal(merged.sourceCount, 2);
  assert.equal(merged.freshSourceCount, 1);
  assert.equal(merged.sources[0].name, 'Property Finder');
  assert.equal(
    shouldQuarantineChange(project, { ...merged, priceMin: 5000000 }, null, 0.35),
    true,
  );
});

test('does not retain daily-only evidence after its freshness window expires', () => {
  const project = {
    priceMeta: {
      status: 'verified',
      updatedAt: '2026-09-18T12:00:00.000Z',
      sources: [
        {
          name: 'Property Finder',
          sourceId: 'property-finder:1',
          observedPrice: 9000000,
        },
      ],
    },
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
      },
    ],
  };

  assert.equal(
    mergeRetainedSources(project, summary, new Set(['Nawy', 'RED']), NOW, 36),
    summary,
  );
});
