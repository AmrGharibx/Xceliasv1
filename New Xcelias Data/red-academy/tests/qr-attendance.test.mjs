import test, {after, before} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {id, today, addDays} from '../public/modules/core.mjs';
import * as qrCore from '../public/modules/qr-attendance-core.mjs';
const {qrBatchExpiryAt} = qrCore;

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'red-academy-qr-'));
process.env.DATABASE_MODE = 'sqlite';
process.env.DATABASE_PATH = path.join(tempDir, 'qr-test.db');
process.env.SEED_SAMPLE_DATA = 'false';
process.env.BOOTSTRAP_ADMIN_EMAIL = 'qr-admin@example.test';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'QR-Test-Admin-Password-123!';
process.env.APP_URL = 'http://localhost:3000';
delete process.env.APP_ENV;

const {handleApi, repository} = await import('../server/service.mjs');
let adminCookie = '';
let viewerCookie = '';
let instructorCookie = '';
let company;

async function request(route, {method = 'GET', body, cookie = '', origin = process.env.APP_URL, custom = true} = {}) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  if (method !== 'GET') {
    headers.set('content-type', 'application/json');
    if (origin) headers.set('origin', origin);
    if (custom) headers.set('x-red-request', '1');
  }
  const response = await handleApi(new Request(`${process.env.APP_URL}/api/${route}`, {
    method,
    headers,
    ...(method !== 'GET' ? {body: JSON.stringify(body || {})} : {}),
  }));
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  return {response, data, status: response.status, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')};
}

async function makeBatch({name = `QR batch ${id()}`, status = 'Active', dates = [today(), addDays(today(), 1)], capacity = 100} = {}) {
  const sorted = [...dates].sort();
  const result = await request('mutate', {
    method: 'POST', cookie: adminCookie,
    body: {table: 'batches', action: 'create', data: {
      batch_name: name, status, start_date: sorted[0], end_date: sorted.at(-1), session_dates: sorted,
      capacity, description: '',
    }},
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data.records[0];
}

async function makeTrainee(batch, name = `QR trainee ${id()}`, phone = '') {
  const result = await request('mutate', {
    method: 'POST', cookie: adminCookie,
    body: {table: 'trainees', action: 'create', data: {
      trainee_name: name, company_id: company.id, batch_id: batch.id, email: '', phone, job_title: '', notes: '',
    }},
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data.records[0];
}

async function ensureBatchQr(batch, cookie = adminCookie) {
  const result = await request('qr-attendance/batch-qr/ensure', {method: 'POST', cookie, body: {batchId: batch.id}});
  return result;
}

async function openSession(batch, cookie = adminCookie, date = today(), venueId = undefined) {
  return request('qr-attendance/sessions/open', {
    method: 'POST', cookie,
    body: {batchId: batch.id, date, ...(venueId ? {venueId} : {})},
  });
}

async function issueCode(trainee, action = 'issue', cookie = adminCookie) {
  return request('qr-attendance/codes', {method: 'POST', cookie, body: {traineeId: trainee.id, action}});
}

async function makeBrowserKey() {
  const pair = await crypto.webcrypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']);
  return {privateKey: pair.privateKey, publicKey: await crypto.webcrypto.subtle.exportKey('jwk', pair.publicKey)};
}

async function linkRequest(batchQrId, publicKey, locator) {
  return request('qr-attendance/public/device-link-requests', {method: 'POST', body: {batchQrId, publicKey, ...locator}});
}

async function linkStatus(batchQrId, requestHandle, privateKey) {
  const message = `xcelias-qr-link-status:v1\n${batchQrId}\n${requestHandle}`;
  const signature = privateKey ? Buffer.from(await crypto.webcrypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, privateKey, new TextEncoder().encode(message))).toString('base64url') : 'A'.repeat(86);
  return request('qr-attendance/public/device-link-status', {method: 'POST', body: {batchQrId, requestHandle, signature}});
}

async function pendingQueue(batchId, cookie = instructorCookie) {
  return request(`qr-attendance/device-link-requests?batchId=${batchId}`, {cookie});
}

async function resolveLink(requestId, action, traineeId, cookie = instructorCookie) {
  return request('qr-attendance/device-link-requests/resolve', {method: 'POST', cookie, body: {requestId, action, ...(traineeId ? {traineeId} : {})}});
}

async function approvedLink(batch, batchQrId, privateKey, publicKey, locator, traineeId) {
  const pending = await linkRequest(batchQrId, publicKey, locator);
  assert.equal(pending.status, 201, JSON.stringify(pending.data));
  const queue = await pendingQueue(batch.id);
  assert.equal(queue.status, 200, JSON.stringify(queue.data));
  const entry = queue.data.items.find(item => item.status === 'pending' && item.publicKey?.x === publicKey.x);
  assert.ok(entry, JSON.stringify(queue.data));
  const resolved = await resolveLink(entry.id, 'approve', traineeId);
  assert.equal(resolved.status, 200, JSON.stringify(resolved.data));
  const status = await linkStatus(batchQrId, pending.data.requestHandle, privateKey);
  assert.equal(status.status, 200, JSON.stringify(status.data));
  assert.equal(status.data.status, 'approved');
  return {...status.data, requestHandle: pending.data.requestHandle};
}

async function getChallenge(batchQrId, credentialId) {
  return request('qr-attendance/public/challenge', {method: 'POST', body: {batchQrId, credentialId}});
}

async function signedCheckIn(batchQrId, credentialId, privateKey, location) {
  const issued = await getChallenge(batchQrId, credentialId);
  assert.equal(issued.status, 200, JSON.stringify(issued.data));
  const signature = await crypto.webcrypto.subtle.sign(
    {name: 'ECDSA', hash: 'SHA-256'}, privateKey, new TextEncoder().encode(issued.data.challenge),
  );
  return request('qr-attendance/public/check-in', {
    method: 'POST',
    body: {batchQrId, credentialId, challengeId: issued.data.challengeId, challenge: issued.data.challenge, signature: Buffer.from(signature).toString('base64url'), location},
  });
}

async function enrolledTrainee(batch, trainee) {
  const ensured = await ensureBatchQr(batch);
  assert.equal(ensured.status, 200, JSON.stringify(ensured.data));
  const opened = await openSession(batch);
  assert.equal(opened.status, 201, JSON.stringify(opened.data));
  const code = await issueCode(trainee);
  assert.equal(code.status, 201, JSON.stringify(code.data));
  const key = await makeBrowserKey();
  const enrollment = await approvedLink(batch, ensured.data.batchQrId, key.privateKey, key.publicKey, {activationCode: code.data.activationCode}, trainee.id);
  return {batch, trainee, batchQrId: ensured.data.batchQrId, credentialId: enrollment.credentialId, privateKey: key.privateKey};
}

const academyLocation = {status: 'ok', latitude: 30.0076922, longitude: 31.5332323, accuracy: 8};

before(async () => {
  const repo = await repository();
  await repo.setup({token: repo.setupToken, email: process.env.BOOTSTRAP_ADMIN_EMAIL, full_name: 'QR Test Administrator', password: process.env.BOOTSTRAP_ADMIN_PASSWORD});
  adminCookie = (await request('auth/login', {method: 'POST', body: {email: process.env.BOOTSTRAP_ADMIN_EMAIL, password: process.env.BOOTSTRAP_ADMIN_PASSWORD}})).cookie;
  const companyResult = await request('mutate', {method: 'POST', cookie: adminCookie, body: {table: 'companies', action: 'create', data: {name: 'QR Test Company'}}});
  assert.equal(companyResult.status, 200);
  company = companyResult.data.records[0];
  for (const role of ['viewer', 'instructor']) {
    const invitation = await request('invitations', {method: 'POST', cookie: adminCookie, body: {email: `qr-${role}@example.test`, full_name: role, role}});
    assert.equal(invitation.status, 201);
    const accepted = await request('auth/accept-invitation', {method: 'POST', body: {token: invitation.data.token, password: 'QR-Test-Staff-Password-123!'}});
    assert.equal(accepted.status, 201);
    const staff = (await request('users', {cookie: adminCookie})).data.find(row => row.email === `qr-${role}@example.test`);
    assert.equal((await request('users', {method: 'PATCH', cookie: adminCookie, body: {id: staff.id, role, active: true}})).status, 200);
    const login = await request('auth/login', {method: 'POST', body: {email: staff.email, password: 'QR-Test-Staff-Password-123!'}});
    if (role === 'viewer') viewerCookie = login.cookie;
    else instructorCookie = login.cookie;
  }
});

after(async () => {
  try { (await repository()).close(); } finally { fs.rmSync(tempDir, {recursive: true, force: true}); }
});

test('qrSessionRequiresActiveBatchAndTodaySchedule', async () => {
  const planning = await makeBatch({status: 'Planning'});
  const inactive = await openSession(planning);
  assert.equal(inactive.status, 409);
  const tomorrow = addDays(today(), 1);
  const future = await makeBatch({dates: [tomorrow]});
  assert.equal((await openSession(future, adminCookie, tomorrow)).status, 409);
  const active = await makeBatch({dates: [addDays(today(), -1), today(), addDays(today(), 1)]});
  assert.equal((await openSession(active, adminCookie, addDays(today(), -1))).status, 400);
});

test('stableBatchQrResolvesOnlyCurrentOpenSession', async () => {
  const batch = await makeBatch();
  const link = await ensureBatchQr(batch);
  assert.equal(link.status, 200);
  const before = await request(`qr-attendance/public/info`, {method: 'POST', body: {batchQrId: link.data.batchQrId}});
  assert.equal(before.status, 200);
  assert.equal(before.data.currentSession, null);
  assert.equal('roster' in before.data, false);
  const opened = await openSession(batch);
  assert.equal(opened.status, 201);
  const current = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: link.data.batchQrId}});
  assert.equal(current.data.currentSession.date, today());
  assert.equal(current.data.currentSession.dayNumber, 1);
  assert.equal((await request('qr-attendance/sessions/close', {method: 'POST', cookie: adminCookie, body: {id: opened.data.id}})).status, 200);
  const closed = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: link.data.batchQrId}});
  assert.equal(closed.data.currentSession, null);

  const reopened = await openSession(batch);
  assert.equal(reopened.status, 201, JSON.stringify(reopened.data));
  assert.notEqual(reopened.data.id, opened.data.id);
  assert.equal(reopened.data.dayNumber, opened.data.dayNumber);
  const currentAgain = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: link.data.batchQrId}});
  assert.equal(currentAgain.data.currentSession.date, today());
  assert.equal(currentAgain.data.currentSession.dayNumber, 1);
});

test('qrSessionNumbersFollowTheFullBatchScheduleEvenForExistingSessions', async () => {
  const dates = [addDays(today(), -2), addDays(today(), -1), today()];
  const batch = await makeBatch({dates});
  const opened = await openSession(batch);
  assert.equal(opened.status, 201, JSON.stringify(opened.data));

  // Existing records can retain a stale day number after a schedule is backfilled.
  const repo = await repository();
  repo.db.prepare('UPDATE qr_attendance_sessions SET day_number=1 WHERE id=?').run(opened.data.id);

  const link = await ensureBatchQr(batch);
  const publicInfo = await request('qr-attendance/public/info', {
    method: 'POST', body: {batchQrId: link.data.batchQrId},
  });
  assert.equal(publicInfo.status, 200);
  assert.equal(publicInfo.data.currentSession.dayNumber, 3);

  const staffState = await request(`qr-attendance/sessions?batchId=${batch.id}&date=${today()}`, {cookie: adminCookie});
  assert.equal(staffState.status, 200);
  assert.equal(staffState.data.session.dayNumber, 3);
});

test('rotatingBatchQrRevokesPriorReference', async () => {
  const batch = await makeBatch();
  const first = await ensureBatchQr(batch);
  const rotated = await request('qr-attendance/batch-qr/rotate', {method: 'POST', cookie: adminCookie, body: {batchId: batch.id}});
  assert.equal(rotated.status, 200);
  assert.notEqual(rotated.data.batchQrId, first.data.batchQrId);
  const oldInfo = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: first.data.batchQrId}});
  assert.equal(oldInfo.status, 404);
});

test('qrActivationCodeIsOneTimeAndHashed', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const issued = await issueCode(trainee);
  assert.equal(issued.status, 201);
  assert.equal(issued.data.expiresAt, qrBatchExpiryAt(batch));
  assert.match(issued.data.activationCode, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  const key = await makeBrowserKey();
  await approvedLink(batch, link.data.batchQrId, key.privateKey, key.publicKey, {activationCode: issued.data.activationCode}, trainee.id);
  const repo = await repository();
  const row = repo.db.prepare('SELECT code_hash, consumed_at, expires_at FROM qr_attendance_activation_codes WHERE trainee_id=?').get(trainee.id);
  assert.equal(row.code_hash.length, 64);
  assert.notEqual(row.code_hash, issued.data.activationCode);
  assert.equal(row.expires_at, qrBatchExpiryAt(batch));
  assert.ok(row.consumed_at);
  assert.equal((await request('state', {cookie: adminCookie})).data.qr_attendance, undefined);
});

test('qrAccessAndActivationCodesExpireAtTheBatchEnd', async () => {
  const batch = await makeBatch({dates: [addDays(today(), -1)]});
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  const repositoryInstance = await repository();
  const enrollmentId = id();
  repositoryInstance.insert('qr_attendance_enrollments', {
    id: enrollmentId, trainee_id: trainee.id, batch_id: batch.id,
    public_key: JSON.stringify({kty: 'EC', crv: 'P-256', x: 'x'.repeat(43), y: 'y'.repeat(43), ext: true, key_ops: ['verify']}),
    created_at: new Date().toISOString(), last_used_at: null, revoked_at: null, revoked_by: null,
  });

  const activation = await issueCode(trainee);
  const info = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: link.data.batchQrId, credentialId: enrollmentId}});
  const challenge = await getChallenge(link.data.batchQrId, enrollmentId);

  assert.equal(activation.status, 410);
  assert.equal(info.status, 410);
  assert.equal(challenge.status, 410);
});

test('qrCodeSuggestsOnlyItsTraineeForTrainerApproval', async () => {
  const batch = await makeBatch();
  const first = await makeTrainee(batch, 'Code owner');
  const other = await makeTrainee(batch, 'Unselected trainee');
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const issued = await issueCode(first);
  const key = await makeBrowserKey();
  const result = await request('qr-attendance/public/device-link-requests', {method: 'POST', body: {
    batchQrId: link.data.batchQrId, activationCode: issued.data.activationCode, publicKey: key.publicKey, traineeId: other.id,
  }});
  assert.equal(result.status, 201);
  assert.equal(result.data.status, 'pending');
  const queue = await pendingQueue(batch.id);
  assert.equal(queue.data.items[0].candidateTraineeId, first.id);
  assert.notEqual(queue.data.items[0].candidateTraineeId, other.id);
});

test('qrRepeatedCodeRequestDoesNotEnrollBeforeApproval', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const issued = await issueCode(trainee);
  const firstKey = await makeBrowserKey();
  const first = await linkRequest(link.data.batchQrId, firstKey.publicKey, {activationCode: issued.data.activationCode});
  const retry = await linkRequest(link.data.batchQrId, firstKey.publicKey, {activationCode: issued.data.activationCode});
  assert.equal(first.status, 201);
  assert.equal(retry.status, 409);
  assert.equal((await repository()).db.prepare('SELECT COUNT(*) count FROM qr_attendance_enrollments WHERE trainee_id=?').get(trainee.id).count, 0);
});

test('qrRevokedKeyAndChallengeReplayAreRejected', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const issued = await getChallenge(enrolled.batchQrId, enrolled.credentialId);
  const signature = await crypto.webcrypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, enrolled.privateKey, new TextEncoder().encode(issued.data.challenge));
  const payload = {batchQrId: enrolled.batchQrId, credentialId: enrolled.credentialId, challengeId: issued.data.challengeId, challenge: issued.data.challenge, signature: Buffer.from(signature).toString('base64url'), location: {status: 'denied'}};
  assert.equal((await request('qr-attendance/public/check-in', {method: 'POST', body: payload})).status, 202);
  const replay = await request('qr-attendance/public/check-in', {method: 'POST', body: payload});
  assert.equal(replay.status, 409);
  const reissued = await issueCode(trainee, 'reissue');
  assert.equal(reissued.status, 201);
  const stillActive = await getChallenge(enrolled.batchQrId, enrolled.credentialId);
  assert.equal(stillActive.status, 200);
});

test('qrGeofenceInsideCreatesPresent', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const result = await signedCheckIn(enrolled.batchQrId, enrolled.credentialId, enrolled.privateKey, academyLocation);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.attendance.status, 'Present');
  const state = (await request('state', {cookie: adminCookie})).data;
  const saved = state.daily_attendance.find(row => row.trainee_id === trainee.id);
  assert.equal(saved.status, 'Present');
  assert.equal(saved.source_meta.method, 'qr');
  assert.ok(saved.arrival_time);
  assert.equal(saved.departure_time, null);
  const ownStatus = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: enrolled.batchQrId, credentialId: enrolled.credentialId}});
  assert.deepEqual(ownStatus.data.participant, {active: true, checkedIn: true, recordedElsewhere: false, arrivalTime: saved.arrival_time});
});

test('qrGeofenceOutsideCreatesReviewNotAttendance', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const result = await signedCheckIn(enrolled.batchQrId, enrolled.credentialId, enrolled.privateKey, {status: 'ok', latitude: 30.02, longitude: 31.5332323, accuracy: 12});
  assert.equal(result.status, 202);
  assert.equal(result.data.attendance, null);
  const state = (await request('state', {cookie: adminCookie})).data;
  assert.equal(state.daily_attendance.some(row => row.trainee_id === trainee.id), false);
  const reviews = await request(`qr-attendance/location-reviews?batchId=${batch.id}&date=${today()}`, {cookie: instructorCookie});
  assert.equal(reviews.status, 200);
  assert.equal(reviews.data.items.length, 1);
  assert.equal(reviews.data.items[0].traineeName, trainee.trainee_name);
  assert.equal('latitude' in reviews.data.items[0], false);
  const repo = await repository();
  const columns = repo.db.prepare('PRAGMA table_info(qr_attendance_location_reviews)').all().map(row => row.name);
  assert.equal(columns.includes('latitude'), false);
  assert.equal(columns.includes('longitude'), false);
});

test('qrGeofenceBoundaryAndPoorAccuracyRequireReview', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const boundary = {status: 'ok', latitude: 30.0094, longitude: 31.5332323, accuracy: 30};
  const result = await signedCheckIn(enrolled.batchQrId, enrolled.credentialId, enrolled.privateKey, boundary);
  assert.equal(result.status, 202);
  assert.equal(result.data.reason, 'boundary_uncertain');
  assert.equal((await request('state', {cookie: adminCookie})).data.daily_attendance.some(row => row.trainee_id === trainee.id), false);
});

test('qrPermissionDeniedDoesNotAutoPass', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const denied = await signedCheckIn(enrolled.batchQrId, enrolled.credentialId, enrolled.privateKey, {status: 'denied'});
  assert.equal(denied.status, 202);
  assert.equal(denied.data.attendance, null);
  assert.equal(denied.data.reviewRequired, true);
  assert.equal((await request('state', {cookie: adminCookie})).data.daily_attendance.some(row => row.trainee_id === trainee.id), false);
});

test('qrLocationPayloadIsValidatedAndNeverPersisted', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const challenge = await getChallenge(enrolled.batchQrId, enrolled.credentialId);
  const signature = await crypto.webcrypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, enrolled.privateKey, new TextEncoder().encode(challenge.data.challenge));
  const repo = await repository();
  const reviewsBefore = repo.db.prepare('SELECT COUNT(*) AS count FROM qr_attendance_location_reviews').get().count;
  const invalid = await request('qr-attendance/public/check-in', {method: 'POST', body: {
    batchQrId: enrolled.batchQrId, credentialId: enrolled.credentialId, challengeId: challenge.data.challengeId, challenge: challenge.data.challenge,
    signature: Buffer.from(signature).toString('base64url'), location: {status: 'ok', latitude: 91, longitude: 31, accuracy: 20},
  }});
  assert.equal(invalid.status, 400);
  assert.equal(repo.db.prepare('SELECT COUNT(*) AS count FROM qr_attendance_location_reviews').get().count, reviewsBefore);
  assert.equal(repo.db.prepare('SELECT COUNT(*) AS count FROM daily_attendance WHERE trainee_id=?').get(trainee.id).count, 0);
});

test('locationReviewRequiresAuthorizedStaff', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  await signedCheckIn(enrolled.batchQrId, enrolled.credentialId, enrolled.privateKey, {status: 'unavailable'});
  const query = `qr-attendance/location-reviews?batchId=${batch.id}&date=${today()}`;
  assert.equal((await request(query)).status, 401);
  assert.equal((await request(query, {cookie: viewerCookie})).status, 403);
  const visible = await request(query, {cookie: instructorCookie});
  assert.equal(visible.status, 200);
  const reviewId = visible.data.items[0].id;
  const premature = await request('qr-attendance/location-reviews/resolve', {method: 'POST', cookie: instructorCookie, body: {reviewId, outcome: 'manual_attendance_recorded'}});
  assert.equal(premature.status, 409);
  const manual = await request('mutate', {method: 'POST', cookie: instructorCookie, body: {table: 'daily_attendance', action: 'create', data: {
    trainee_id: trainee.id, batch_id: batch.id, date: today(), status: 'Present', arrival_time: null, departure_time: null, is_late: false,
  }}});
  assert.equal(manual.status, 200, JSON.stringify(manual.data));
  const resolved = await request('qr-attendance/location-reviews/resolve', {method: 'POST', cookie: instructorCookie, body: {reviewId, outcome: 'manual_attendance_recorded'}});
  assert.equal(resolved.status, 200);
});

test('qrCheckInUsesCairoDateAndServerTime', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const before = Date.now();
  const result = await signedCheckIn(enrolled.batchQrId, enrolled.credentialId, enrolled.privateKey, academyLocation);
  const after = Date.now();
  assert.equal(result.status, 200);
  const row = (await request('state', {cookie: adminCookie})).data.daily_attendance.find(item => item.trainee_id === trainee.id);
  assert.equal(row.date, today());
  assert.ok(Date.parse(row.arrival_time) >= before - 1000 && Date.parse(row.arrival_time) <= after + 1000);
  assert.equal(new Date(row.arrival_time).toISOString(), row.arrival_time);
});

test('qrCheckInPreservesExistingStatus', async () => {
  for (const status of ['Absent', 'Tour Day', 'Off Day', 'Present']) {
    const batch = await makeBatch();
    const trainee = await makeTrainee(batch, `Existing ${status}`);
    const manual = await request('mutate', {method: 'POST', cookie: adminCookie, body: {table: 'daily_attendance', action: 'create', data: {
      trainee_id: trainee.id, batch_id: batch.id, date: today(), status, arrival_time: null, departure_time: null, is_late: false,
    }}});
    assert.equal(manual.status, 200, JSON.stringify(manual.data));
    const enrolled = await enrolledTrainee(batch, trainee);
    const result = await signedCheckIn(enrolled.batchQrId, enrolled.credentialId, enrolled.privateKey, academyLocation);
    assert.equal(result.status, 409);
    const row = (await request('state', {cookie: adminCookie})).data.daily_attendance.find(item => item.trainee_id === trainee.id);
    assert.equal(row.status, status);
    const ownStatus = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: enrolled.batchQrId, credentialId: enrolled.credentialId}});
    assert.equal(ownStatus.data.participant.recordedElsewhere, true);
    assert.equal(ownStatus.data.participant.checkedIn, false);
  }
});

test('qrFortyConcurrentTraineesCreateFortyRows', async () => {
  const batch = await makeBatch({capacity: 50});
  const repo = await repository();
  const now = new Date().toISOString();
  const trainees = Array.from({length: 40}, (_, index) => {
    const trainee = {id: id(), trainee_name: `Concurrent QR ${index + 1}`, company_id: company.id, batch_id: batch.id, email: '', phone: '', job_title: '', notes: '', enrollment_status: 'Active', source_id: null, source_meta: {}, version: 1, created_at: now, updated_at: now};
    repo.insert('trainees', trainee);
    return trainee;
  });
  const link = await ensureBatchQr(batch);
  assert.equal(link.status, 200);
  assert.equal((await openSession(batch)).status, 201);
  const participants = await Promise.all(trainees.map(async trainee => {
    const issued = await issueCode(trainee);
    assert.equal(issued.status, 201, JSON.stringify(issued.data));
    const key = await makeBrowserKey();
    const linked = await approvedLink(batch, link.data.batchQrId, key.privateKey, key.publicKey, {activationCode: issued.data.activationCode}, trainee.id);
    return {credentialId: linked.credentialId, privateKey: key.privateKey};
  }));
  const results = await Promise.all(participants.map(({credentialId, privateKey}) => signedCheckIn(link.data.batchQrId, credentialId, privateKey, academyLocation)));
  assert.ok(results.every(result => result.status === 200));
  assert.equal(repo.db.prepare("SELECT COUNT(*) AS count FROM daily_attendance WHERE batch_id=? AND date=? AND status='Present' AND json_extract(source_meta,'$.method')='qr'").get(batch.id, today()).count, 40);
});

test('qrPublicRoutesNeverExposeStaffStateOrRoster', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch, 'Must not leak from QR info');
  const link = await ensureBatchQr(batch);
  const info = await request('qr-attendance/public/info', {method: 'POST', body: {batchQrId: link.data.batchQrId}});
  assert.equal(info.status, 200);
  assert.equal(JSON.stringify(info.data).includes(trainee.trainee_name), false);
  assert.equal('roster' in info.data, false);
  assert.equal('locationReviewHistory' in info.data, false);
  assert.equal(info.response.headers.get('cache-control'), 'no-store');
  assert.equal((await request('state')).status, 401);
});

test('qrPhoneRequestIsGenericAndWaitsForStaffApproval', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch, 'Phone candidate', '010 1234 5678');
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const key = await makeBrowserKey();
  const pending = await linkRequest(link.data.batchQrId, key.publicKey, {phone: '+20 10 1234 5678'});
  assert.equal(pending.status, 201);
  assert.deepEqual(Object.keys(pending.data).sort(), ['requestHandle', 'status']);
  assert.equal(pending.data.status, 'pending');
  assert.equal((await linkStatus(link.data.batchQrId, pending.data.requestHandle, key.privateKey)).data.status, 'pending');
  const queue = await pendingQueue(batch.id);
  assert.equal(queue.data.items[0].candidateTraineeId, trainee.id);
  assert.equal(queue.data.items[0].candidateTraineeName, trainee.trainee_name);
  assert.equal((await repository()).db.prepare('SELECT COUNT(*) count FROM qr_attendance_enrollments WHERE trainee_id=?').get(trainee.id).count, 0);
  assert.equal((await resolveLink(queue.data.items[0].id, 'approve')).status, 200);
  const approved = await linkStatus(link.data.batchQrId, pending.data.requestHandle, key.privateKey);
  assert.equal(approved.data.status, 'approved');
  assert.equal(approved.data.traineeName, trainee.trainee_name);
  assert.ok(approved.data.credentialId);
});

test('qrUnknownOrDuplicatePhoneDoesNotEnumerateRoster', async () => {
  const batch = await makeBatch();
  await makeTrainee(batch, 'One', '010 2222 3333');
  await makeTrainee(batch, 'Two', '+20 10 2222 3333');
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const keyA = await makeBrowserKey();
  const keyB = await makeBrowserKey();
  const unknown = await linkRequest(link.data.batchQrId, keyA.publicKey, {phone: '01099998888'});
  const ambiguous = await linkRequest(link.data.batchQrId, keyB.publicKey, {phone: '0020 10 2222 3333'});
  assert.equal(unknown.status, 201);
  assert.equal(ambiguous.status, 201);
  assert.deepEqual({...unknown.data, requestHandle: '<opaque>'}, {...ambiguous.data, requestHandle: '<opaque>'});
  const queue = await pendingQueue(batch.id);
  assert.equal(queue.data.items.filter(item => item.candidateTraineeId === null).length, 2);
  assert.equal(JSON.stringify(queue.data).includes('01099998888'), false);
  assert.equal(JSON.stringify(queue.data).includes('01022223333'), false);
  assert.equal(qrCore.normalizeQrPhone?.('0020 10 2222 3333'), '01022223333');
  assert.equal(qrCore.normalizeQrPhone?.('123-abc'), null);
});

test('qrLinkRequestNeedsOpenSessionAndExpires', async () => {
  const batch = await makeBatch();
  const link = await ensureBatchQr(batch);
  const key = await makeBrowserKey();
  assert.equal((await linkRequest(link.data.batchQrId, key.publicKey, {phone: '01012345678'})).status, 409);
  const opened = await openSession(batch);
  const pending = await linkRequest(link.data.batchQrId, key.publicKey, {phone: '01012345678'});
  assert.equal(pending.status, 201);
  const repo = await repository();
  const row = repo.db.prepare('SELECT id,expires_at FROM qr_attendance_device_link_requests WHERE public_key LIKE ?').get(`%${key.publicKey.x}%`);
  assert.ok(Date.parse(row.expires_at) <= Date.now() + 30 * 60 * 1000);
  repo.db.prepare('UPDATE qr_attendance_device_link_requests SET expires_at=? WHERE id=?').run(new Date(Date.now() - 1000).toISOString(), row.id);
  assert.equal((await linkStatus(link.data.batchQrId, pending.data.requestHandle, key.privateKey)).data.status, 'expired');
  assert.equal((await resolveLink(row.id, 'approve', id())).status, 409);
  assert.equal((await request('qr-attendance/sessions/close', {method: 'POST', cookie: adminCookie, body: {id: opened.data.id}})).status, 200);
});

test('qrRecoveryCodeDoesNotConsumeUntilApproval', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const code = await issueCode(trainee);
  const key = await makeBrowserKey();
  const pending = await linkRequest(link.data.batchQrId, key.publicKey, {activationCode: code.data.activationCode});
  assert.equal(pending.status, 201);
  const repo = await repository();
  assert.equal(repo.db.prepare('SELECT consumed_at FROM qr_attendance_activation_codes WHERE trainee_id=?').get(trainee.id).consumed_at, null);
  const queue = await pendingQueue(batch.id);
  assert.equal((await resolveLink(queue.data.items[0].id, 'reject')).status, 200);
  assert.equal((await linkStatus(link.data.batchQrId, pending.data.requestHandle, key.privateKey)).data.status, 'rejected');
  assert.equal(repo.db.prepare('SELECT consumed_at FROM qr_attendance_activation_codes WHERE trainee_id=?').get(trainee.id).consumed_at, null);
  const nextKey = await makeBrowserKey();
  const next = await approvedLink(batch, link.data.batchQrId, nextKey.privateKey, nextKey.publicKey, {activationCode: code.data.activationCode}, trainee.id);
  assert.ok(next.credentialId);
  assert.ok(repo.db.prepare('SELECT consumed_at FROM qr_attendance_activation_codes WHERE trainee_id=?').get(trainee.id).consumed_at);
});

test('qrApprovalBindsRequestPublicKey', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, trainee);
  const repo = await repository();
  const saved = repo.db.prepare('SELECT public_key FROM qr_attendance_enrollments WHERE id=?').get(enrolled.credentialId);
  const submitted = await crypto.webcrypto.subtle.exportKey('jwk', enrolled.privateKey);
  assert.equal(JSON.parse(saved.public_key).x, submitted.x);
  assert.equal(JSON.parse(saved.public_key).y, submitted.y);
  assert.equal((await getChallenge(enrolled.batchQrId, enrolled.credentialId)).status, 200);
});

test('qrLinkStatusRequiresRequestKeyProof', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const code = await issueCode(trainee);
  const key = await makeBrowserKey();
  const approved = await approvedLink(batch, link.data.batchQrId, key.privateKey, key.publicKey, {activationCode: code.data.activationCode}, trainee.id);
  assert.ok(approved.credentialId);
  const wrongKey = await makeBrowserKey();
  assert.equal((await linkStatus(link.data.batchQrId, approved.requestHandle, wrongKey.privateKey)).status, 401);
  const repo = await repository();
  const handle = repo.db.prepare('SELECT handle_hash FROM qr_attendance_device_link_requests WHERE public_key LIKE ?').get(`%${key.publicKey.x}%`);
  assert.equal(handle.handle_hash.length, 64);
  const secondKey = await makeBrowserKey();
  const second = await linkRequest(link.data.batchQrId, secondKey.publicKey, {phone: '01099998888'});
  assert.equal((await linkStatus(link.data.batchQrId, second.data.requestHandle, key.privateKey)).status, 401);
  assert.equal((await linkStatus(link.data.batchQrId, second.data.requestHandle, null)).status, 401);
});

test('qrInvalidRecoveryCodeIsGenericButCannotBeApproved', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const key = await makeBrowserKey();
  const requestResult = await linkRequest(link.data.batchQrId, key.publicKey, {activationCode: 'AAAA-BBBB-CCCC-DDDD'});
  assert.equal(requestResult.status, 201);
  assert.deepEqual(Object.keys(requestResult.data).sort(), ['requestHandle', 'status']);
  const queue = await pendingQueue(batch.id);
  assert.equal(queue.data.items[0].candidateTraineeId, null);
  assert.equal((await resolveLink(queue.data.items[0].id, 'approve', trainee.id)).status, 409);
  assert.equal((await linkStatus(link.data.batchQrId, requestResult.data.requestHandle, key.privateKey)).data.status, 'pending');
});

test('qrClosedSessionExpiresPendingRequestAndAllowsSameKeyRetry', async () => {
  const batch = await makeBatch();
  const link = await ensureBatchQr(batch);
  const opened = await openSession(batch);
  const key = await makeBrowserKey();
  const first = await linkRequest(link.data.batchQrId, key.publicKey, {phone: '01012345678'});
  assert.equal(first.status, 201);
  assert.equal((await request('qr-attendance/sessions/close', {method: 'POST', cookie: adminCookie, body: {id: opened.data.id}})).status, 200);
  assert.equal((await linkStatus(link.data.batchQrId, first.data.requestHandle, key.privateKey)).data.status, 'expired');
  assert.equal((await openSession(batch)).status, 201);
  assert.equal((await linkRequest(link.data.batchQrId, key.publicKey, {phone: '01012345678'})).status, 201);
});

test('qrDeviceCannotBindToAnotherTrainee', async () => {
  const batch = await makeBatch();
  const one = await makeTrainee(batch);
  const two = await makeTrainee(batch);
  const enrolled = await enrolledTrainee(batch, one);
  const key = await crypto.webcrypto.subtle.exportKey('jwk', await crypto.webcrypto.subtle.importKey('jwk', JSON.parse((await repository()).db.prepare('SELECT public_key FROM qr_attendance_enrollments WHERE id=?').get(enrolled.credentialId).public_key), {name: 'ECDSA', namedCurve: 'P-256'}, true, ['verify']));
  const code = await issueCode(two);
  assert.equal((await linkRequest(enrolled.batchQrId, key, {activationCode: code.data.activationCode})).status, 409);
  assert.equal((await repository()).db.prepare('SELECT COUNT(*) count FROM qr_attendance_enrollments WHERE trainee_id=? AND revoked_at IS NULL').get(two.id).count, 0);
});

test('qrReplacementPreservesOldDeviceUntilApproved', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const old = await enrolledTrainee(batch, trainee);
  const code = await issueCode(trainee, 'reissue');
  assert.equal(code.status, 201);
  assert.equal((await getChallenge(old.batchQrId, old.credentialId)).status, 200);
  const key = await makeBrowserKey();
  const pending = await linkRequest(old.batchQrId, key.publicKey, {activationCode: code.data.activationCode});
  assert.equal(pending.status, 201);
  assert.equal((await getChallenge(old.batchQrId, old.credentialId)).status, 200);
  const queue = await pendingQueue(batch.id);
  assert.equal((await resolveLink(queue.data.items[0].id, 'approve')).status, 409);
  assert.equal((await resolveLink(queue.data.items[0].id, 'approve_replace')).status, 200);
  assert.equal((await getChallenge(old.batchQrId, old.credentialId)).status, 401);
  assert.equal((await linkStatus(old.batchQrId, pending.data.requestHandle, key.privateKey)).data.status, 'approved');
});

test('qrTrainerQueueRequiresWriterSession', async () => {
  const batch = await makeBatch();
  const route = `qr-attendance/device-link-requests?batchId=${batch.id}`;
  assert.equal((await request(route)).status, 401);
  assert.equal((await request(route, {cookie: viewerCookie})).status, 403);
  assert.equal((await pendingQueue(batch.id)).status, 200);
  assert.equal((await resolveLink(id(), 'reject', undefined, viewerCookie)).status, 403);
  assert.equal((await request('qr-attendance/device-link-requests/resolve', {method: 'POST', cookie: instructorCookie, origin: 'https://wrong.example', body: {requestId: id(), action: 'reject'}})).status, 403);
});

test('qrLegacyEnrollRouteFailsClosed', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const code = await issueCode(trainee);
  const key = await makeBrowserKey();
  const result = await request('qr-attendance/public/enroll', {method: 'POST', body: {batchQrId: link.data.batchQrId, activationCode: code.data.activationCode, publicKey: key.publicKey}});
  assert.ok([409, 410].includes(result.status));
  assert.equal((await repository()).db.prepare('SELECT COUNT(*) count FROM qr_attendance_enrollments WHERE trainee_id=?').get(trainee.id).count, 0);
  assert.equal((await repository()).db.prepare('SELECT consumed_at FROM qr_attendance_activation_codes WHERE trainee_id=?').get(trainee.id).consumed_at, null);
});
