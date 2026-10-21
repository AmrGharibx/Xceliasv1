const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const BATCH_QR_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function normalizeParticipantAppUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Invalid production participant base.');
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Invalid production participant base.');
  }

  if (
    url.protocol !== 'https:' ||
    url.host !== 'xcelias.com' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !['/red-academy', '/red-academy/'].includes(url.pathname)
  ) {
    throw new Error('Invalid production participant base.');
  }

  return 'https://xcelias.com/red-academy';
}

export function qrAttendanceUrl({ currentHref, configuredBase, batchQrId } = {}) {
  if (typeof batchQrId !== 'string' || !BATCH_QR_ID_PATTERN.test(batchQrId)) {
    throw new Error('Invalid batch QR reference.');
  }

  let currentUrl;
  try {
    currentUrl = new URL(currentHref);
  } catch {
    throw new Error('Invalid current page URL.');
  }

  if (
    !['http:', 'https:'].includes(currentUrl.protocol) ||
    currentUrl.username ||
    currentUrl.password
  ) {
    throw new Error('Invalid current page URL.');
  }

  const isLocal = LOCAL_HOSTS.has(currentUrl.hostname.toLowerCase());
  const base = isLocal
    ? currentUrl.origin
    : normalizeParticipantAppUrl(configuredBase);
  return `${base}/qr-attendance#/batch/${batchQrId}`;
}
