import test from 'node:test';
import assert from 'node:assert/strict';
import {participantOriginForBuild} from '../scripts/participant-origin.mjs';

test('keeps participant links on the main host until the subdomain is explicitly enabled', () => {
  assert.equal(participantOriginForBuild('https://join.xcelias.com', false), '');
  assert.equal(participantOriginForBuild('https://join.xcelias.com', undefined), '');
});

test('allows only the approved HTTPS participant subdomain after explicit enablement', () => {
  assert.equal(participantOriginForBuild('https://join.xcelias.com', true), 'https://join.xcelias.com');
  assert.equal(participantOriginForBuild('http://join.xcelias.com', true), '');
  assert.equal(participantOriginForBuild('https://other.example', true), '');
  assert.equal(participantOriginForBuild('https://user:pass@join.xcelias.com', true), '');
  assert.equal(participantOriginForBuild('https://join.xcelias.com/path', true), '');
});
