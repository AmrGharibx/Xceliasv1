const PARTICIPANT_HOST = 'join.xcelias.com';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export function isParticipantHost(hostname) {
  return String(hostname || '').toLowerCase() === PARTICIPANT_HOST;
}

export function participantLink(currentHref, hash, participantOrigin = '') {
  const url = new URL(currentHref);
  if (!LOCAL_HOSTS.has(url.hostname.toLowerCase()) && participantOrigin) {
    try {
      const target = new URL(participantOrigin);
      if (target.protocol === 'https:' && target.origin === `https://${PARTICIPANT_HOST}`) {
        url.protocol = 'https:';
        url.hostname = PARTICIPANT_HOST;
        url.port = '';
        url.pathname = '/red-academy/trainer-activities/';
      }
    } catch {}
  }
  if (url.hostname === PARTICIPANT_HOST) {
    url.pathname = '/red-academy/trainer-activities/';
  }
  url.search = '';
  url.hash = hash.startsWith('#') ? hash : `#${hash}`;
  return url.href;
}
