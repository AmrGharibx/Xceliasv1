import {addDays, atCairo, validDate} from './core.mjs';

export const QR_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const DEFAULT_ACADEMY_VENUE = Object.freeze({
  id: 'academy-default',
  name: 'Red Training Academy',
  latitude: 30.0076922,
  longitude: 31.5332323,
  radius_m: 200,
});

const QR_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const ACTIVATION_CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{16}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const encoder = new TextEncoder();

export function isBatchQrReference(value) {
  return typeof value === 'string' && QR_REFERENCE_PATTERN.test(value);
}

export function normalizeActivationCode(value) {
  if (typeof value !== 'string' || value.length > 40) return null;
  const normalized = value.replace(/[-\s]/g, '').toUpperCase();
  return ACTIVATION_CODE_PATTERN.test(normalized) ? normalized : null;
}

export function cairoSessionDayNumber(sessionDates, date) {
  if (!validDate(date)) return null;
  let dates = sessionDates;
  if (typeof dates === 'string') {
    try { dates = JSON.parse(dates); } catch { return null; }
  }
  if (!Array.isArray(dates) || dates.some(value => !validDate(value))) return null;
  const index = [...new Set(dates)].sort().indexOf(date);
  return index < 0 ? null : index + 1;
}

export function nextCairoMidnight(date) {
  if (!validDate(date)) throw new TypeError('A valid Cairo session date is required.');
  return atCairo(addDays(date, 1), '00:00');
}

function scheduledDates(batch) {
  let dates = batch?.session_dates;
  if (typeof dates === 'string') {
    try { dates = JSON.parse(dates); } catch { return []; }
  }
  return Array.isArray(dates) ? [...new Set(dates.filter(validDate))].sort() : [];
}

export function qrBatchEndDate(batch) {
  if (validDate(batch?.end_date)) return batch.end_date;
  return scheduledDates(batch).at(-1) || null;
}

export function qrBatchExpiryAt(batch) {
  const endDate = qrBatchEndDate(batch);
  return endDate ? atCairo(endDate, '20:00') : null;
}

export function qrBatchSessionExpiryAt(batch, date) {
  if (!validDate(date)) return null;
  const batchExpiry = qrBatchExpiryAt(batch);
  if (!batchExpiry) return null;
  return new Date(Math.min(Date.parse(nextCairoMidnight(date)), Date.parse(batchExpiry))).toISOString();
}

export function isQrBatchExpired(batch, now = new Date()) {
  const expiry = qrBatchExpiryAt(batch);
  const nowTime = now instanceof Date ? now.getTime() : Date.parse(now);
  return !expiry || !Number.isFinite(nowTime) || Date.parse(expiry) <= nowTime;
}

export function sanitizeP256PublicKey(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.kty !== 'EC' || value.crv !== 'P-256' ||
      typeof value.x !== 'string' || typeof value.y !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(value.x) || !/^[A-Za-z0-9_-]{43}$/.test(value.y) ||
      Object.hasOwn(value, 'd')) return null;
  return {kty: 'EC', crv: 'P-256', x: value.x, y: value.y, ext: true, key_ops: ['verify']};
}

export function encodeBase64Url(bytes) {
  const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof btoa === 'function') {
    let binary = '';
    for (const byte of value) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  return Buffer.from(value).toString('base64url');
}

export function decodeBase64Url(value) {
  if (typeof value !== 'string' || !BASE64URL_PATTERN.test(value) || value.length > 256) return null;
  try {
    if (typeof atob === 'function') {
      const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
      return Uint8Array.from(binary, character => character.charCodeAt(0));
    }
    return new Uint8Array(Buffer.from(value, 'base64url'));
  } catch {
    return null;
  }
}

export async function verifyP256Challenge(publicKey, challenge, signature) {
  const key = sanitizeP256PublicKey(publicKey);
  const signatureBytes = decodeBase64Url(signature);
  if (!key || typeof challenge !== 'string' || challenge.length < 32 || !signatureBytes || signatureBytes.length !== 64) return false;
  try {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.subtle) return false;
    const imported = await cryptoApi.subtle.importKey('jwk', key, {name: 'ECDSA', namedCurve: 'P-256'}, false, ['verify']);
    return await cryptoApi.subtle.verify({name: 'ECDSA', hash: 'SHA-256'}, imported, signatureBytes, encoder.encode(challenge));
  } catch {
    return false;
  }
}

function accuracyBand(accuracy) {
  if (accuracy == null) return 'unknown';
  if (accuracy <= 25) return '0-25m';
  if (accuracy <= 75) return '26-75m';
  if (accuracy <= 150) return '76-150m';
  return 'over-150m';
}

function distanceBand(distance, radius) {
  if (distance <= radius) return 'within-radius';
  if (distance <= radius + 500) return 'up-to-500m-outside';
  return 'over-500m-outside';
}

export function evaluateVenueLocation(location, venue) {
  if (!location || typeof location !== 'object' || Array.isArray(location)) throw new TypeError('Location data is invalid.');
  if (!venue || !Number.isFinite(venue.latitude) || !Number.isFinite(venue.longitude) || !Number.isFinite(venue.radius_m)) {
    throw new TypeError('Venue settings are invalid.');
  }
  if (location.status !== 'ok') {
    if (!['denied', 'unavailable', 'timeout'].includes(location.status)) throw new TypeError('Location status is invalid.');
    return {
      accepted: false,
      reason: location.status === 'denied' ? 'permission_denied' : `location_${location.status}`,
      accuracyBand: 'unknown',
      distanceBand: 'unknown',
    };
  }
  const {latitude, longitude, accuracy} = location;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100000) {
    throw new TypeError('Location data is invalid.');
  }

  const toRadians = degrees => degrees * Math.PI / 180;
  const lat1 = toRadians(venue.latitude);
  const lat2 = toRadians(latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = toRadians(longitude - venue.longitude);
  const haversine = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const distance = 6371008.8 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(Math.max(0, 1 - haversine)));
  const accepted = distance + accuracy <= venue.radius_m;
  const outside = distance - accuracy > venue.radius_m;
  return {
    accepted,
    reason: accepted ? 'inside_geofence' : outside ? 'outside_geofence' : 'boundary_uncertain',
    accuracyBand: accuracyBand(accuracy),
    distanceBand: distanceBand(distance, venue.radius_m),
  };
}
