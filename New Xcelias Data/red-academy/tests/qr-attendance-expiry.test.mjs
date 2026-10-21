import test from 'node:test';
import assert from 'node:assert/strict';
import {atCairo} from '../public/modules/core.mjs';
import {isQrBatchExpired, qrBatchExpiryAt, qrBatchSessionExpiryAt} from '../public/modules/qr-attendance-core.mjs';

test('qrBatchExpiryUsesTheBatchEndDateAtEightPmCairoTime', () => {
  const batch = {end_date: '2026-10-30', session_dates: ['2026-10-28', '2026-10-30']};

  assert.equal(qrBatchExpiryAt(batch), atCairo('2026-10-30', '20:00'));
  assert.equal(qrBatchSessionExpiryAt(batch, '2026-10-30'), atCairo('2026-10-30', '20:00'));
  assert.equal(qrBatchSessionExpiryAt(batch, '2026-10-29'), atCairo('2026-10-30', '00:00'));
});

test('qrBatchExpiryFallsBackToTheLastScheduledDateWhenEndDateIsMissing', () => {
  assert.equal(qrBatchExpiryAt({end_date: null, session_dates: '["2026-10-22","2026-10-30"]'}), atCairo('2026-10-30', '20:00'));
});

test('qrBatchExpiryHasAnExactClosedBoundary', () => {
  const batch = {end_date: '2026-10-30'};
  const cutoff = qrBatchExpiryAt(batch);

  assert.equal(isQrBatchExpired(batch, new Date(Date.parse(cutoff) - 1)), false);
  assert.equal(isQrBatchExpired(batch, new Date(cutoff)), true);
  assert.equal(isQrBatchExpired(batch, new Date(Date.parse(cutoff) + 1)), true);
});

test('qrBatchExpiryFailsClosedWhenNoUsableEndDateExists', () => {
  assert.equal(qrBatchExpiryAt({end_date: 'not-a-date', session_dates: []}), null);
  assert.equal(isQrBatchExpired({end_date: null, session_dates: []}, new Date('2026-10-21T10:00:00.000Z')), true);
});
