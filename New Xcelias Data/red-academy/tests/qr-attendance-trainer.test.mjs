import assert from 'node:assert/strict';
import test from 'node:test';
import {today} from '../public/modules/core.mjs';
import {qrExpiryLabel, renderQrAttendanceActions, renderQrDeviceLinkRequests, resolveQrDeviceLinkRequest} from '../public/modules/qr-attendance-trainer.mjs';

const batch = {id: 'batch-1', status: 'Active', session_dates: [today()]};

test('closed attendance session can be reopened on its scheduled day', () => {
  const markup = renderQrAttendanceActions(batch, {
    session: {id: 'session-1', closed: true},
  }, []);
  const openButton = markup.match(/<button\b[^>]*data-qr-action="open-session"[^>]*>/)?.[0];

  assert.ok(openButton, 'the reopen action is visible');
  assert.doesNotMatch(openButton, /\sdisabled(?:\s|>)/, 'the reopen action is enabled');
  assert.doesNotMatch(markup, /data-qr-action="close-session"/, 'a closed session has no close action');
});

test('open attendance session can be closed but not opened twice', () => {
  const markup = renderQrAttendanceActions(batch, {
    session: {id: 'session-1', closed: false},
  }, []);

  assert.match(markup, /data-qr-action="close-session" data-session="session-1"/);
  assert.doesNotMatch(markup, /data-qr-action="open-session"/);
});

test('activationCodeExpiryLabelShowsDateAndCairoCutoffTime', () => {
  const label = qrExpiryLabel('2026-10-30T18:00:00.000Z');

  assert.match(label, /30 October 2026/i);
  assert.match(label, /8:00 pm/i);
  assert.match(label, /Cairo/i);
});

test('device link queue shows candidate, request method, and time with escaped values', () => {
  const markup = renderQrDeviceLinkRequests([{
    id: 'request-1',
    candidateTraineeId: 'trainee-1',
    candidateTraineeName: '<img src=x onerror=alert(1)>',
    createdAt: '2026-10-22T09:30:00.000Z',
    expiresAt: '2026-10-22T10:00:00.000Z',
    hasActiveDevice: false,
    usedRecoveryCode: true,
  }], []);

  assert.match(markup, /<section[^>]*data-device-link-queue/);
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(markup, /<img src=x/);
  assert.match(markup, /Private recovery code/);
  assert.match(markup, /phone or recovery-code match is only a suggestion/i);
  assert.match(markup, /data-device-action="approve"/);
  assert.match(markup, /data-device-action="reject"/);
});

test('unmatched device request requires trainer to choose an active trainee in this batch', () => {
  const markup = renderQrDeviceLinkRequests([{
    id: 'request-2', candidateTraineeId: null, candidateTraineeName: null,
    createdAt: '2026-10-22T09:30:00.000Z', expiresAt: '2026-10-22T10:00:00.000Z',
    hasActiveDevice: false, usedRecoveryCode: false,
  }], [{id: 'trainee-1', trainee_name: 'Mina', enrollment_status: 'Active', batch_id: 'batch-1'}]);

  assert.match(markup, /Needs trainer matching/);
  assert.match(markup, /data-device-trainee-select="request-2"/);
  assert.match(markup, /value="trainee-1"/);
  assert.match(markup, /Phone number/);
  assert.doesNotMatch(markup, /value="trainee-inactive"/);
});

test('an active-device request exposes replacement as a distinct action', () => {
  const markup = renderQrDeviceLinkRequests([{
    id: 'request-3', candidateTraineeId: 'trainee-1', candidateTraineeName: 'Mina',
    createdAt: '2026-10-22T09:30:00.000Z', expiresAt: '2026-10-22T10:00:00.000Z',
    hasActiveDevice: true, usedRecoveryCode: false,
  }], []);

  assert.match(markup, /Active phone already linked/);
  assert.match(markup, /data-device-action="approve_replace"/);
  assert.match(markup, /data-device-action="reject"/);
});

test('read-only device request view contains no approval or rejection controls', () => {
  const markup = renderQrDeviceLinkRequests([{
    id: 'request-4', candidateTraineeId: 'trainee-1', candidateTraineeName: 'Mina',
    createdAt: '2026-10-22T09:30:00.000Z', expiresAt: '2026-10-22T10:00:00.000Z',
    hasActiveDevice: false, usedRecoveryCode: false,
  }], [], false);

  assert.doesNotMatch(markup, /data-device-action=/);
  assert.match(markup, /View only/);
});

test('manual match only replaces an existing phone after a second explicit confirmation', async () => {
  const calls = [];
  const store = {api: async (path, method, body) => {
    calls.push({path, method, body});
    if (calls.length === 1) {
      const error = new Error('This trainee already has an active device. Confirm replacement with the trainer first.');
      error.status = 409;
      throw error;
    }
    return {ok: true, status: 'approved'};
  }};
  const confirmations = [];

  const result = await resolveQrDeviceLinkRequest(store, {
    requestId: 'request-5', action: 'approve', traineeId: 'trainee-1',
  }, message => { confirmations.push(message); return true; });

  assert.equal(result.status, 'approved');
  assert.equal(confirmations.length, 1);
  assert.match(confirmations[0], /existing linked phone/i);
  assert.deepEqual(calls.map(call => call.body.action), ['approve', 'approve_replace']);
  assert.ok(calls.every(call => call.body.traineeId === 'trainee-1'));
});

test('declining replacement leaves the pending request and old phone unchanged', async () => {
  const calls = [];
  const store = {api: async (_path, _method, body) => {
    calls.push(body);
    const error = new Error('This trainee already has an active device. Confirm replacement with the trainer first.');
    error.status = 409;
    throw error;
  }};

  await assert.rejects(
    resolveQrDeviceLinkRequest(store, {requestId: 'request-6', action: 'approve', traineeId: 'trainee-1'}, () => false),
    error => error.code === 'QR_DEVICE_REPLACEMENT_DECLINED',
  );
  assert.deepEqual(calls.map(call => call.action), ['approve']);
});
