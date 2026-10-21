import assert from 'node:assert/strict';
import test from 'node:test';
import {today} from '../public/modules/core.mjs';
import {qrExpiryLabel, renderQrAttendanceActions} from '../public/modules/qr-attendance-trainer.mjs';

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
