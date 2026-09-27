export function createQrDataUrl(value, qrFactory) {
  if (typeof value !== 'string' || !value.trim() || value.length > 1200) {
    throw new TypeError('QR content must be a non-empty URL under 1,200 characters.');
  }
  if (typeof qrFactory !== 'function') {
    throw new TypeError('The local QR encoder is unavailable.');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('QR content must be an absolute URL.');
  }
  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname.toLowerCase());
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password) {
    throw new TypeError('QR links must use HTTPS, except on the local development server.');
  }

  const qr = qrFactory(0, 'Q');
  qr.addData(url.href, 'Byte');
  qr.make();
  const dataUrl = qr.createDataURL(6, 4);
  if (typeof dataUrl !== 'string' || !/^data:image\/gif;base64,[A-Za-z0-9+/]+=*$/.test(dataUrl)) {
    throw new Error('The local QR encoder returned an invalid image.');
  }
  return dataUrl;
}
