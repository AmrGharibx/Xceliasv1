export function participantOriginForBuild(value, enabled = false) {
  if (enabled !== true) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.origin === 'https://join.xcelias.com'
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && url.pathname === '/'
      ? url.origin
      : '';
  } catch {
    return '';
  }
}
