import test from 'node:test';
import assert from 'node:assert/strict';

const batchQrId = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';

test('qrAttendanceUrlUsesXceliasFromGithubMirror', async () => {
  const { qrAttendanceUrl } = await import('../public/modules/qr-attendance-url.mjs');

  assert.equal(
    qrAttendanceUrl({
      currentHref: 'https://amrgharib.github.io/red-academy/',
      configuredBase: 'https://xcelias.com/red-academy',
      batchQrId,
    }),
    `https://xcelias.com/red-academy/qr-attendance#/batch/${batchQrId}`,
  );
});

test('qrAttendanceUrlStaysLocalForLoopback', async () => {
  const { qrAttendanceUrl } = await import('../public/modules/qr-attendance-url.mjs');

  assert.equal(
    qrAttendanceUrl({
      currentHref: 'http://127.0.0.1:4173/',
      configuredBase: 'https://xcelias.com/red-academy',
      batchQrId,
    }),
    `http://127.0.0.1:4173/qr-attendance#/batch/${batchQrId}`,
  );
  assert.equal(
    qrAttendanceUrl({
      currentHref: 'http://localhost:4000/',
      configuredBase: '',
      batchQrId,
    }),
    `http://localhost:4000/qr-attendance#/batch/${batchQrId}`,
  );
});

test('qrAttendanceUrlRejectsUnapprovedProductionBase', async () => {
  const { qrAttendanceUrl } = await import('../public/modules/qr-attendance-url.mjs');

  for (const configuredBase of [
    'https://join.xcelias.com/red-academy',
    'https://xcelias.com.evil.example/red-academy',
    'http://xcelias.com/red-academy',
    'https://user:secret@xcelias.com/red-academy',
    'https://xcelias.com/red-academy?redirect=evil',
  ]) {
    assert.throws(
      () =>
        qrAttendanceUrl({
          currentHref: 'https://staff.example.com/',
          configuredBase,
          batchQrId,
        }),
      /invalid production participant base/i,
    );
  }
});

test('qrAttendanceUrlIsStablePerBatchAcrossDates', async () => {
  const { qrAttendanceUrl } = await import('../public/modules/qr-attendance-url.mjs');
  const configuredBase = 'https://xcelias.com/red-academy';

  const dayOneUrl = qrAttendanceUrl({
    currentHref: 'https://staff.example.com/?sessionDate=2026-10-21&dayNumber=1',
    configuredBase,
    batchQrId,
  });
  const dayTwoUrl = qrAttendanceUrl({
    currentHref: 'https://staff.example.com/?sessionDate=2026-10-22&dayNumber=2',
    configuredBase,
    batchQrId,
  });

  assert.equal(dayOneUrl, dayTwoUrl);
});

test('qrBatchQrUrlContainsNoSessionDateOrDay', async () => {
  const { qrAttendanceUrl } = await import('../public/modules/qr-attendance-url.mjs');

  const url = qrAttendanceUrl({
    currentHref: 'https://staff.example.com/',
    configuredBase: 'https://xcelias.com/red-academy',
    batchQrId,
  });

  assert.equal(new URL(url).hash, `#/batch/${batchQrId}`);
  assert.doesNotMatch(url, /2026-|session|day\d/i);
});

test('qrAttendanceUrlRejectsMalformedBatchQrIds', async () => {
  const { qrAttendanceUrl } = await import('../public/modules/qr-attendance-url.mjs');

  for (const invalidId of ['', 'short', '../admin', 'a'.repeat(129), 'a'.repeat(32) + '=']) {
    assert.throws(
      () =>
        qrAttendanceUrl({
          currentHref: 'https://staff.example.com/',
          configuredBase: 'https://xcelias.com/red-academy',
          batchQrId: invalidId,
        }),
      /invalid batch qr reference/i,
    );
  }
});
