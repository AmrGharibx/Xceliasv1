'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { applyInventory, catalogueHealth, isSafeImageUrl } = require('./core');

const imageUrl = 'https://prod-images.nawy.com/processed/compound_image/image/1/high.webp';

function inventoryRecord(overrides = {}) {
  return {
    sourceId: 'nawy-inventory:1',
    name: 'Harbor Heights',
    developer: 'Example Developments',
    zone: 'New Cairo',
    lat: 30.01,
    lng: 31.4,
    imageUrl,
    priceMin: 6000000,
    unitTypes: ['Apartment', 'Penthouse'],
    downPayment: 5,
    installmentYears: 8,
    paymentPlan: '5% Down Payment, 8 Years Installments',
    ...overrides,
  };
}

test('recognizes direct HTTPS image assets only', () => {
  assert.equal(isSafeImageUrl(imageUrl), true);
  assert.equal(isSafeImageUrl('https://developer.example/project'), false);
  assert.equal(isSafeImageUrl('javascript:alert(1)'), false);
});

test('enriches an existing matched project with a missing photo without duplicating it', () => {
  const data = {
    projects: [
      {
        name: 'Harbor Heights',
        dev: 'Example Developments',
        zone: 'New Cairo',
        lat: 30.01,
        lng: 31.4,
        type: 'residential',
      },
    ],
    projectDetails: {
      'Harbor Heights': { images: [], masterplan: '', layouts: [] },
    },
  };

  const result = applyInventory(data, [inventoryRecord()], '2026-09-22T00:00:00.000Z');

  assert.equal(result.summary.projectsAdded, 0);
  assert.equal(result.summary.imagesAdded, 1);
  assert.equal(result.data.projects.length, 1);
  assert.deepEqual(result.data.projectDetails['Harbor Heights'].images, [imageUrl]);
});

test('adds a fully qualified new project with an observed, not verified, price', () => {
  const result = applyInventory(
    { projects: [], projectDetails: {} },
    [inventoryRecord()],
    '2026-09-22T00:00:00.000Z',
  );

  const [project] = result.data.projects;
  assert.equal(result.summary.projectsAdded, 1);
  assert.equal(project.priceMin, 6000000);
  assert.equal(project.priceMeta, undefined);
  assert.equal(project.catalogMeta.status, 'observed');
  assert.deepEqual(result.data.projectDetails[project.name].images, [imageUrl]);
});

test('does not add a project when its image is not a direct asset', () => {
  const result = applyInventory(
    { projects: [], projectDetails: {} },
    [inventoryRecord({ imageUrl: 'https://developer.example/project' })],
    '2026-09-22T00:00:00.000Z',
  );

  assert.equal(result.summary.projectsAdded, 0);
  assert.equal(result.data.projects.length, 0);
});

test('reports reference pages separately from displayable plans', () => {
  const health = catalogueHealth({
    projects: [{ name: 'Harbor Heights' }],
    projectDetails: {
      'Harbor Heights': {
        images: [imageUrl],
        masterplan: 'https://developer.example/harbor-heights',
        layouts: ['https://developer.example/harbor-heights/layouts'],
      },
    },
  });

  assert.equal(health.projectsWithImages, 1);
  assert.equal(health.referenceMasterplans, 1);
  assert.equal(health.referenceLayouts, 1);
  assert.equal(health.directMasterplans, 0);
  assert.equal(health.directLayouts, 0);
});
