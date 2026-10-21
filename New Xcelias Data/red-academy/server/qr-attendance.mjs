import crypto from 'node:crypto';
import {isId, ApiError} from './validation.mjs';
import {isBatchQrReference, normalizeActivationCode, sanitizeP256PublicKey} from '../public/modules/qr-attendance-core.mjs';
import {validDate} from '../public/modules/core.mjs';

const fail = message => { throw new ApiError(400, message); };
const rate = async (repo, key, limit, seconds, message) => {
  if (!await repo.rate(`qr:${key}`, limit, seconds)) throw new ApiError(429, message);
};
function checkedQrId(value) {
  if (!isBatchQrReference(value)) throw new ApiError(404, 'This batch QR is invalid or no longer active.');
  return value;
}

function checkedLocation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Location data is invalid.');
  if (['denied', 'unavailable', 'timeout'].includes(value.status)) return {status: value.status};
  if (value.status !== 'ok' || !Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90 ||
      !Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180 ||
      !Number.isFinite(value.accuracy) || value.accuracy < 0 || value.accuracy > 100000) {
    fail('Location data is invalid. Check your location settings and try again.');
  }
  return {status: 'ok', latitude: value.latitude, longitude: value.longitude, accuracy: value.accuracy};
}

function canWrite(user) {
  if (!user || !['admin', 'instructor'].includes(user.role)) throw new ApiError(403, 'Your role is read-only.');
}

export async function handleQrPublicRoute(repo, route, method, body) {
  if (method !== 'POST' || !route.startsWith('qr-attendance/public/')) return null;
  const action = route.slice('qr-attendance/public/'.length);
  if (!['info', 'enroll', 'challenge', 'check-in'].includes(action)) return null;
  if (action === 'info') {
    const batchQrId = checkedQrId(body.batchQrId);
    await rate(repo, `info:${crypto.createHash('sha256').update(batchQrId).digest('hex')}`, 240, 60, 'Too many QR checks. Wait a moment and try again.');
    return {body: await repo.qrSessionInfo({batchQrId,credentialId:body.credentialId}), status: 200};
  }
  if (action === 'enroll') {
    const batchQrId = checkedQrId(body.batchQrId);
    const activationCode = normalizeActivationCode(body.activationCode);
    const publicKey = sanitizeP256PublicKey(body.publicKey);
    if (!activationCode || !publicKey) fail('Enter the private activation code provided by reception.');
    const codeKey = crypto.createHash('sha256').update(activationCode).digest('hex');
    await rate(repo, `enroll:${codeKey}`, 12, 900, 'Too many setup attempts for this code. Ask reception for help.');
    await rate(repo, 'enroll:global', 500, 60, 'Too many QR setup attempts. Wait a moment and try again.');
    const result = await repo.qrEnroll({batchQrId, activationCode, publicKey});
    return {body: result, status: result.alreadyEnrolled ? 200 : 201};
  }
  if (action === 'challenge') {
    const batchQrId = checkedQrId(body.batchQrId);
    if (!isId(body.credentialId)) throw new ApiError(401, 'This device is not enrolled. Ask reception to set it up.');
    const credentialHash = crypto.createHash('sha256').update(body.credentialId).digest('hex');
    await rate(repo, `challenge:${credentialHash}`, 20, 60, 'Too many check-in attempts. Wait a moment and try again.');
    await rate(repo, 'challenge:global', 1200, 60, 'Too many check-in attempts. Wait a moment and try again.');
    return {body: await repo.qrChallenge({batchQrId, credentialId: body.credentialId}), status: 200};
  }
  const batchQrId = checkedQrId(body.batchQrId);
  if (!isId(body.credentialId) || !isId(body.challengeId) || typeof body.challenge !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(body.challenge) || typeof body.signature !== 'string' ||
      !/^[A-Za-z0-9_-]{86}$/.test(body.signature)) {
    throw new ApiError(401, 'Your device check could not be verified. Try again or ask reception for help.');
  }
  const credentialHash = crypto.createHash('sha256').update(body.credentialId).digest('hex');
  await rate(repo, `check-in:${credentialHash}`, 12, 300, 'Too many check-in attempts. Wait a moment and try again.');
  await rate(repo, 'check-in:global', 2000, 60, 'Too many check-in attempts. Wait a moment and try again.');
  const result = await repo.qrCheckIn({
    batchQrId,
    credentialId: body.credentialId,
    challengeId: body.challengeId,
    challenge: body.challenge,
    signature: body.signature,
    location: checkedLocation(body.location),
  });
  return {body: result, status: result.reviewRequired ? 202 : 200, changed: true};
}

export async function handleQrStaffRoute(repo, route, method, body, url, user) {
  if (!route.startsWith('qr-attendance/')) return null;
  const path = route.slice('qr-attendance/'.length);
  if (path === 'sessions' && method === 'GET') {
    canWrite(user);
    const batchId = url.searchParams.get('batchId') || '';
    const date = url.searchParams.get('date') || '';
    if (!isId(batchId)) fail('Choose a valid batch.');
    if (!validDate(date)) fail('Choose a valid session date.');
    return {body: await repo.qrSessionState({batchId, date}), status: 200};
  }
  if (path === 'venues' && method === 'GET') {
    canWrite(user);
    return {body: await repo.qrVenues(), status: 200};
  }
  if (path === 'location-reviews' && method === 'GET') {
    canWrite(user);
    const batchId = url.searchParams.get('batchId') || '';
    const date = url.searchParams.get('date') || '';
    if (!isId(batchId)) fail('Choose a valid batch.');
    if (!validDate(date)) fail('Choose a valid session date.');
    return {body: await repo.qrLocationReviews({batchId, date}), status: 200};
  }
  const mutation = async (callback, status = 200) => {
    canWrite(user);
    return {body: await callback(), status, changed: true};
  };
  if (path === 'batch-qr/ensure' && method === 'POST') {
    if (!isId(body.batchId)) fail('Choose a valid batch.');
    return mutation(() => repo.qrEnsureBatchLink({batchId: body.batchId}, user));
  }
  if (path === 'batch-qr/rotate' && method === 'POST') {
    if (!isId(body.batchId)) fail('Choose a valid batch.');
    return mutation(() => repo.qrRotateBatchLink({batchId: body.batchId}, user));
  }
  if (path === 'codes' && method === 'POST') {
    if (!isId(body.traineeId) || !['issue', 'reissue'].includes(body.action)) fail('Choose a trainee and activation-code action.');
    return mutation(() => repo.qrIssueCode({traineeId: body.traineeId, action: body.action}, user), 201);
  }
  if (path === 'venues/upsert' && method === 'POST') {
    const {id, name, latitude, longitude, radius_m, active} = body;
    if (id !== undefined && id !== 'academy-default' && !isId(id)) fail('Choose a valid venue.');
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) fail('Enter a venue name between 2 and 100 characters.');
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) fail('Enter valid venue coordinates.');
    if (!Number.isInteger(radius_m) || radius_m < 50 || radius_m > 2000 || typeof active !== 'boolean') fail('Choose an active venue and a radius between 50 and 2000 metres.');
    return mutation(() => repo.qrUpsertVenue({id, name: name.trim(), latitude, longitude, radius_m, active}, user));
  }
  if (path === 'sessions/open' && method === 'POST') {
    if (!isId(body.batchId) || !validDate(body.date)) fail('Choose a valid batch and session date.');
    if (body.venueId !== undefined && body.venueId !== 'academy-default' && !isId(body.venueId)) fail('Choose a valid venue.');
    return mutation(() => repo.qrOpenSession({batchId: body.batchId, date: body.date, venueId: body.venueId}, user), 201);
  }
  if (path === 'sessions/close' && method === 'POST') {
    if (!isId(body.id)) fail('Choose a valid QR session.');
    return mutation(() => repo.qrCloseSession({id: body.id}, user));
  }
  if (path === 'location-reviews/resolve' && method === 'POST') {
    if (!isId(body.reviewId) || !['manual_attendance_recorded', 'dismissed'].includes(body.outcome)) fail('Choose a location review and resolution.');
    return mutation(() => repo.qrResolveLocationReview({reviewId: body.reviewId, outcome: body.outcome}, user));
  }
  return null;
}
