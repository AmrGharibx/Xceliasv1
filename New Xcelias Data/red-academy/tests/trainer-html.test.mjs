import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {withTrainerBaseHref} from '../scripts/trainer-html.mjs';

test('trainer page assets resolve when the host removes the page trailing slash', async () => {
  const source = await readFile(new URL('../public/trainer-activities/index.html', import.meta.url), 'utf8');
  const deployed = withTrainerBaseHref(source, '/red-academy/trainer-activities/');
  const baseHref = deployed.match(/<base href="([^"]+)">/)?.[1];
  assert.equal(baseHref, '/red-academy/trainer-activities/');

  const page = new URL('https://xcelias.com/red-academy/trainer-activities');
  for (const asset of ['./trainer-activities.css', './qr-codes.css', './trainer-activities.mjs']) {
    assert.equal(new URL(asset, new URL(baseHref, page)).pathname, `/red-academy/trainer-activities/${asset.slice(2)}`);
  }
});

test('cloud build replaces the local base and rejects unsafe base paths', () => {
  assert.equal(
    withTrainerBaseHref('<head><base href="/trainer-activities/"></head>', '/red-academy/trainer-activities/'),
    '<head><base href="/red-academy/trainer-activities/"></head>',
  );
  assert.throws(() => withTrainerBaseHref('<head></head>', 'https://evil.example/'), /safe same-origin path/);
});
