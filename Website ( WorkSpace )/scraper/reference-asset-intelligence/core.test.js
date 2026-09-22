'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyReferenceAssets,
  extractReferenceAssets,
  projectReferencePages,
} = require('./core');

const pageUrl = 'https://developer.example.com/projects/harbor-heights';
const masterplanUrl = 'https://developer.example.com/assets/harbor-master-plan.png';
const layoutUrl = 'https://developer.example.com/assets/harbor-floor-plan.pdf';
const coverUrl = 'https://developer.example.com/assets/harbor-cover.webp';

const html = `
  <html><head>
    <title>Harbor Heights | Example Developments</title>
    <meta property="og:image" content="${coverUrl}">
  </head><body>
    <section id="master-plan"><img src="${masterplanUrl}" alt="Master Plan"></section>
    <a href="${layoutUrl}">Download floor plan</a>
    <img src="https://developer.example.com/assets/hero.jpg" alt="Hero">
  </body></html>`;

test('extracts only semantically labelled plan assets and a matched page cover', () => {
  const result = extractReferenceAssets('Harbor Heights', html, pageUrl);

  assert.equal(result.matchedProject, true);
  assert.equal(result.coverImage, coverUrl);
  assert.deepEqual(result.masterplans, [masterplanUrl]);
  assert.deepEqual(result.layouts, [{ url: layoutUrl, kind: 'pdf' }]);
});

test('rejects a page whose title does not identify the linked project', () => {
  const result = extractReferenceAssets('Harbor Heights', '<title>Generic Projects</title>', pageUrl);

  assert.equal(result.matchedProject, false);
  assert.deepEqual(result.masterplans, []);
});

test('moves page references aside when verified display assets are found', () => {
  const data = {
    projects: [{ name: 'Harbor Heights' }],
    projectDetails: {
      'Harbor Heights': {
        images: [],
        masterplan: pageUrl,
        layouts: [pageUrl],
      },
    },
  };
  const result = applyReferenceAssets(
    data,
    [
      {
        projectName: 'Harbor Heights',
        matchedProject: true,
        coverImage: coverUrl,
        masterplans: [masterplanUrl],
        layouts: [{ url: layoutUrl, kind: 'pdf' }],
      },
    ],
    '2026-09-22T00:00:00.000Z',
  );
  const details = result.data.projectDetails['Harbor Heights'];

  assert.equal(result.summary.imagesAdded, 1);
  assert.equal(result.summary.masterplansAdded, 1);
  assert.equal(result.summary.layoutsAdded, 1);
  assert.equal(details.masterplan, masterplanUrl);
  assert.deepEqual(details.layouts, [{ url: layoutUrl, kind: 'pdf' }]);
  assert.deepEqual(details.assetReferences.masterplan, [pageUrl]);
  assert.deepEqual(details.assetReferences.layouts, [pageUrl]);
});

test('collects only non-direct plan references for project page harvesting', () => {
  const pages = projectReferencePages({
    projects: [{ name: 'Harbor Heights' }],
    projectDetails: {
      'Harbor Heights': {
        masterplan: masterplanUrl,
        layouts: [pageUrl],
        assetReferences: { masterplan: [pageUrl] },
      },
    },
  });
  assert.deepEqual(pages, [{ projectName: 'Harbor Heights', url: pageUrl }]);
});
