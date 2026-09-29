'use strict';

const fs = require('fs');
const path = require('path');

const portalHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const portalJs = fs.readFileSync(path.join(__dirname, '..', 'portal.js'), 'utf8');

describe('Market to Mastery coming-soon portal card', () => {
  const cardStart = portalHtml.indexOf('data-project="markettomastery"');
  const cardEnd = portalHtml.indexOf('<!-- Card 9: Pitch Lab -->', cardStart);
  const cardMarkup = portalHtml.slice(cardStart, cardEnd);

  test('is labeled Coming soon and has no interactive card keyboard target', () => {
    expect(cardStart).toBeGreaterThanOrEqual(0);
    expect(cardMarkup).toContain('data-coming-soon="true"');
    expect(cardMarkup).toContain('Coming soon');
    expect(cardMarkup).not.toContain('tabindex=');
    expect(cardMarkup).toMatch(/<button[^>]*disabled[^>]*>/);
    expect(cardMarkup).not.toContain('Open Market Desk');
  });

  test('portal click, keyboard, and stale deep-link paths cannot launch it', () => {
    expect(portalJs).toMatch(/markettomastery:\s*\{[^}]*comingSoon:\s*true/s);
    expect(portalJs).toMatch(/if\s*\(!proj\s*\|\|\s*proj\.comingSoon\)\s*return/);
    expect(portalJs).toMatch(/if\s*\(PROJECTS\[key\]\?\.comingSoon\s*\|\|\s*card\.dataset\.comingSoon\s*===\s*'true'\)\s*return/);
  });
});
