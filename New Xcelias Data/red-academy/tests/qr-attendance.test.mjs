import test, {after, before} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {id, today, addDays} from '../public/modules/core.mjs';

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

async function makeBatch({name = `QR batch ${id()}`, status = 'Active', dates = [today()], capacity = 100} = {}) {
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

async function makeTrainee(batch, name = `QR trainee ${id()}`) {
  const result = await request('mutate', {
    method: 'POST', cookie: adminCookie,
    body: {table: 'trainees', action: 'create', data: {
      trainee_name: name, company_id: company.id, batch_id: batch.id, email: '', phone: '', job_title: '', notes: '',
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

async function enroll(batchQrId, activationCode, publicKey) {
  return request('qr-attendance/public/enroll', {method: 'POST', body: {batchQrId, activationCode, publicKey}});
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
  const enrollment = await enroll(ensured.data.batchQrId, code.data.activationCode, key.publicKey);
  assert.equal(enrollment.status, 201, JSON.stringify(enrollment.data));
  return {batch, trainee, batchQrId: ensured.data.batchQrId, credentialId: enrollment.data.credentialId, privateKey: key.privateKey};
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
  const active = await makeBatch();
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
  assert.match(issued.data.activationCode, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  const key = await makeBrowserKey();
  assert.equal((await enroll(link.data.batchQrId, issued.data.activationCode, key.publicKey)).status, 201);
  const repo = await repository();
  const row = repo.db.prepare('SELECT code_hash, consumed_at FROM qr_attendance_activation_codes WHERE trainee_id=?').get(trainee.id);
  assert.equal(row.code_hash.length, 64);
  assert.notEqual(row.code_hash, issued.data.activationCode);
  assert.ok(row.consumed_at);
  assert.equal((await request('state', {cookie: adminCookie})).data.qr_attendance, undefined);
});

test('qrCodeDerivesTraineeFromActivationCode', async () => {
  const batch = await makeBatch();
  const first = await makeTrainee(batch, 'Code owner');
  const other = await makeTrainee(batch, 'Unselected trainee');
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const issued = await issueCode(first);
  const key = await makeBrowserKey();
  const result = await request('qr-attendance/public/enroll', {method: 'POST', body: {
    batchQrId: link.data.batchQrId, activationCode: issued.data.activationCode, publicKey: key.publicKey, traineeId: other.id,
  }});
  assert.equal(result.status, 201);
  assert.equal(result.data.traineeName, first.trainee_name);
  const repo = await repository();
  assert.equal(repo.db.prepare('SELECT trainee_id FROM qr_attendance_enrollments WHERE id=?').get(result.data.credentialId).trainee_id, first.id);
});

test('qrEnrollmentRetryAcceptsOnlySamePublicKey', async () => {
  const batch = await makeBatch();
  const trainee = await makeTrainee(batch);
  const link = await ensureBatchQr(batch);
  await openSession(batch);
  const issued = await issueCode(trainee);
  const firstKey = await makeBrowserKey();
  const first = await enroll(link.data.batchQrId, issued.data.activationCode, firstKey.publicKey);
  const retry = await enroll(link.data.batchQrId, issued.data.activationCode, firstKey.publicKey);
  const otherKey = await makeBrowserKey();
  const changed = await enroll(link.data.batchQrId, issued.data.activationCode, otherKey.publicKey);
  assert.equal(first.status, 201);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.credentialId, first.data.credentialId);
  assert.equal(changed.status, 409);
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
  const revoked = await getChallenge(enrolled.batchQrId, enrolled.credentialId);
  assert.equal(revoked.status, 401);
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
    const linked = await enroll(link.data.batchQrId, issued.data.activationCode, key.publicKey);
    assert.equal(linked.status, 201, JSON.stringify(linked.data));
    return {credentialId: linked.data.credentialId, privateKey: key.privateKey};
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
