import test from 'node:test';
import assert from 'node:assert/strict';
import {isParticipantHost, participantLink} from '../public/trainer-activities/participant-links.mjs';

test('production trainee links use the join subdomain and participant app route', () => {
  const href = participantLink('https://xcelias.com/red-academy/trainer-activities/?preview=1', '/learner/abc_DEF-123', 'https://join.xcelias.com');
  assert.equal(href, 'https://join.xcelias.com/red-academy/trainer-activities/#/learner/abc_DEF-123');
});

test('production live-room links use the same join subdomain', () => {
  const href = participantLink('https://xcelias.com/red-academy/trainer-activities/', '/room/ABCDEFGHJK', 'https://join.xcelias.com');
  assert.equal(href, 'https://join.xcelias.com/red-academy/trainer-activities/#/room/ABCDEFGHJK');
});

test('local trainee links stay on the local server', () => {
  const href = participantLink('http://127.0.0.1:3000/trainer-activities/?test=1', '/learner/abc_DEF-123', 'https://join.xcelias.com');
  assert.equal(href, 'http://127.0.0.1:3000/trainer-activities/#/learner/abc_DEF-123');
});

test('without the production toggle, trainee links stay on the current host', () => {
  const href = participantLink('https://xcelias.com/red-academy/trainer-activities/', '/learner/abc_DEF-123');
  assert.equal(href, 'https://xcelias.com/red-academy/trainer-activities/#/learner/abc_DEF-123');
});

test('participant origin rejects non-HTTPS and unapproved hosts', () => {
  const current = 'https://xcelias.com/red-academy/trainer-activities/';
  assert.equal(participantLink(current, '/learner/abc_DEF-123', 'http://join.xcelias.com'), `${current}#/learner/abc_DEF-123`);
  assert.equal(participantLink(current, '/learner/abc_DEF-123', 'https://other.example'), `${current}#/learner/abc_DEF-123`);
});

test('only the exact join hostname enables participant-only mode', () => {
  assert.equal(isParticipantHost('join.xcelias.com'), true);
  assert.equal(isParticipantHost('JOIN.XCELIAS.COM'), true);
  assert.equal(isParticipantHost('xcelias.com'), false);
  assert.equal(isParticipantHost('notjoin.xcelias.com'), false);
});
