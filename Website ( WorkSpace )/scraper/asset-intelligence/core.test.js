'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { applyAssetInventory, directImages } = require('./core');

const imageUrl = 'https://assets.example.com/project/cover.webp';
const masterplanUrl = 'https://assets.example.com/project/masterplan.png';

function project() {
  return {
    name: 'Harbor Heights',
    dev: 'Example Developments',
    zone: 'New Cairo',
    lat: 30.01,
    lng: 31.4,
  };
}

function asset(overrides = {}) {
  return {
    source: 'RED asset',
    sourceId: 'red-asset:1',
    name: 'Harbor Heights',
    developer: 'Example Developments',
    zone: 'New Cairo',
    lat: 30.01,
    lng: 31.4,
    priceMin: 0,
    imageUrls: [imageUrl],
    masterplan: masterplanUrl,
    layouts: [],
    ...overrides,
  };
}

test('accepts direct image assets and ignores non-image URLs', () => {
  assert.deepEqual(
    directImages([imageUrl, 'https://assets.example.com/project/page', 'javascript:alert(1)']),
    [imageUrl],
  );
});

test('fills an image and replaces a reference masterplan while retaining the reference', () => {
  const data = {
    projects: [project()],
    projectDetails: {
      'Harbor Heights': {
        images: [],
        masterplan: 'https://developer.example.com/harbor-heights',
        layouts: [],
      },
    },
  };
  const result = applyAssetInventory(data, [asset()], '2026-09-22T00:00:00.000Z');
  const details = result.data.projectDetails['Harbor Heights'];

  assert.equal(result.summary.imagesAdded, 1);
  assert.equal(result.summary.masterplansAdded, 1);
  assert.deepEqual(details.images, [imageUrl]);
  assert.equal(details.masterplan, masterplanUrl);
  assert.deepEqual(details.assetReferences.masterplan, [
    'https://developer.example.com/harbor-heights',
  ]);
});

test('does not overwrite an already direct masterplan or a populated image set', () => {
  const existingImage = 'https://assets.example.com/project/existing.jpg';
  const existingMasterplan = 'https://assets.example.com/project/existing-plan.png';
  const data = {
    projects: [project()],
    projectDetails: {
      'Harbor Heights': {
        images: [existingImage],
        masterplan: existingMasterplan,
        layouts: [],
      },
    },
  };
  const result = applyAssetInventory(data, [asset()], '2026-09-22T00:00:00.000Z');
  const details = result.data.projectDetails['Harbor Heights'];

  assert.equal(result.summary.imagesAdded, 0);
  assert.equal(result.summary.masterplansAdded, 0);
  assert.deepEqual(details.images, [existingImage]);
  assert.equal(details.masterplan, existingMasterplan);
});

test('does not mutate an unmatched project', () => {
  const data = { projects: [project()], projectDetails: {} };
  const result = applyAssetInventory(
    data,
    [asset({ name: 'Different Project', developer: 'Different Developer' })],
    '2026-09-22T00:00:00.000Z',
  );

  assert.equal(result.summary.matchedProjects, 0);
  assert.deepEqual(result.data.projectDetails, {});
});

test('assigns a source asset to only the best project when legacy names collide', () => {
  const nearProject = project();
  const distantProject = { ...project(), lat: 30.8, lng: 31.8 };
  const data = { projects: [nearProject, distantProject], projectDetails: {} };
  const result = applyAssetInventory(data, [asset()], '2026-09-22T00:00:00.000Z');

  assert.equal(result.summary.matchedProjects, 1);
  assert.ok(result.data.projectDetails['Harbor Heights']);
  // Duplicate names deliberately share a details key in the old data model;
  // the one-to-one assignment is verified by the single matched project count.
});

test('inherits an image only for a strict nearby alias of the same project', () => {
  const canonical = {
    name: 'Harbor Heights',
    dev: 'Example Developments',
    zone: 'North Coast',
    lat: 31.0,
    lng: 28.0,
  };
  const alias = {
    name: 'Harbor Heights Ras El Hekma',
    dev: 'Example Developments',
    zone: 'Ras El Hekma',
    lat: 31.002,
    lng: 28.002,
  };
  const data = {
    projects: [canonical, alias],
    projectDetails: {
      'Harbor Heights': { images: [imageUrl], masterplan: masterplanUrl, layouts: [] },
      'Harbor Heights Ras El Hekma': { images: [], masterplan: '', layouts: [] },
    },
  };
  const result = applyAssetInventory(data, [], '2026-09-22T00:00:00.000Z');
  const details = result.data.projectDetails['Harbor Heights Ras El Hekma'];

  assert.equal(result.summary.aliasImagesInherited, 1);
  assert.equal(result.summary.aliasMasterplansInherited, 1);
  assert.deepEqual(details.images, [imageUrl]);
  assert.equal(details.masterplan, masterplanUrl);
  assert.equal(details.assetMeta.aliasOf, 'Harbor Heights');
});
