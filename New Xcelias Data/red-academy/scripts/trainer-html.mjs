export function withTrainerBaseHref(html, baseHref) {
  if (typeof html !== 'string' || typeof baseHref !== 'string' || !/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(baseHref)) {
    throw new TypeError('Trainer base URL must be a safe same-origin path ending in /.');
  }
  const baseTag = `<base href="${baseHref}">`;
  if (/<base\s+href=["'][^"']*["']\s*\/?\s*>/i.test(html)) {
    return html.replace(/<base\s+href=["'][^"']*["']\s*\/?\s*>/i, baseTag);
  }
  if (!/<head(?:\s[^>]*)?>/i.test(html)) {
    throw new Error('Trainer page is missing its head element.');
  }
  return html.replace(/<head(?:\s[^>]*)?>/i, match => `${match}\n  ${baseTag}`);
}
