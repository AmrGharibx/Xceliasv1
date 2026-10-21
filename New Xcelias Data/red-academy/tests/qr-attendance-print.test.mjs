import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as qrTrainer from '../public/modules/qr-attendance-trainer.mjs';

function renderPass() {
  assert.equal(typeof qrTrainer.renderQrAttendancePass, 'function', 'the pass renderer is exposed for deterministic contract tests');
  return qrTrainer.renderQrAttendancePass({batch_name: 'Batch 44'}, 'data:image/gif;base64,AA==');
}

test('printable QR pass resolves the Academy logo from the canonical app route', () => {
  const html = renderPass();
  const logo = html.match(/<img class="qr-pass-logo" src="([^"]+)" alt="Red Training Academy">/)?.[1];

  assert.equal(new URL(logo, 'https://xcelias.com/red-academy/index.html').pathname, '/red-academy/training-academy-logo.svg');
});

test('printable QR pass does not expose a redundant public URL below the code', () => {
  const html = renderPass();

  assert.doesNotMatch(html, /qr-pass-url|xcelias\.com\/red-academy\/qr-attendance/);
  assert.match(html, /data:image\/gif;base64,AA==/);
});

test('printable QR pass places an Academy cap mark on a white center island inside a framed code', () => {
  const html = renderPass();

  assert.match(html, /class="qr-pass-frame"[^>]*>[\s\S]*class="qr-pass-code"/);
  assert.match(html, /class="qr-pass-mark"[^>]*aria-hidden="true"[\s\S]*<img src="\.\/training-academy-logo\.svg" alt="">/);
});

test('print stylesheet exposes only a normal-flow pass, not a globally hidden print subtree', async () => {
  const [css, html] = await Promise.all([
    readFile(new URL('../public/qr-attendance/print.css', import.meta.url), 'utf8'),
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  ]);

  assert.match(html, /qr-attendance\/print\.css/);
  assert.doesNotMatch(css, /body\.printing-qr-pass\s+\*\s*\{\s*visibility:\s*hidden/i);
  assert.match(css, /body\.printing-qr-pass\s+#modal-root\s*\{[^}]*display:\s*block\s*!important/i);
  assert.match(css, /body\.printing-qr-pass\s+#qr-staff-content\s*\{[^}]*display:\s*block\s*!important/i);
  assert.match(css, /body\.printing-qr-pass\s+\.qr-print-preview\s*\{[^}]*position:\s*static\s*!important/i);
});

test('printed Academy logo and signature use dark artwork without a dark backing plate', async () => {
  const css = await readFile(new URL('../public/qr-attendance/print.css', import.meta.url), 'utf8');

  assert.match(css, /body\.printing-qr-pass\s+\.qr-pass-brand\s*\{[^}]*background:\s*transparent/i);
  assert.match(css, /body\.printing-qr-pass\s+\.qr-pass-brand\s+\.qr-pass-logo\s*\{[^}]*filter:\s*brightness\(0\)/i);
  assert.match(css, /body\.printing-qr-pass\s+\.qr-pass-signature\s*\{[^}]*color:\s*#111827/i);
  assert.match(css, /body\.printing-qr-pass\s+\.qr-pass-frame\s*\{[^}]*border:/i);
  assert.match(css, /body\.printing-qr-pass\s+\.qr-pass-mark\s*\{[^}]*background:\s*#fff/i);
});
