import test from 'node:test';
import assert from 'node:assert/strict';
import qrcode from 'qrcode-generator';
import {createQrDataUrl} from '../public/modules/qr-code.mjs';

test('generates a scannable local QR image for a private production challenge URL', () => {
  const link = `https://join.xcelias.com/red-academy/trainer-activities/#/learner/${'A'.repeat(43)}`;
  const image = createQrDataUrl(link, qrcode);
  assert.match(image, /^data:image\/gif;base64,/);
  assert.ok(Buffer.from(image.split(',')[1], 'base64').length > 100);
});

test('supports localhost trainee links without weakening non-local HTTPS checks', () => {
  assert.match(createQrDataUrl('http://127.0.0.1:3000/trainer-activities/#/room/ABCDEFGHJK', qrcode), /^data:image\/gif;base64,/);
  assert.throws(() => createQrDataUrl('http://example.com/private-link', qrcode), /must use HTTPS/);
  assert.throws(() => createQrDataUrl('javascript:alert(1)', qrcode), /absolute URL|must use HTTPS/);
});

test('rejects missing, credential-bearing, oversized or unsupported QR content', () => {
  const input = 'https://join.xcelias.com/private';
  assert.throws(() => createQrDataUrl('', qrcode), /non-empty URL/);
  assert.throws(() => createQrDataUrl(`${input}${'x'.repeat(1200)}`, qrcode), /under 1,200 characters/);
  assert.throws(() => createQrDataUrl('https://user:secret@join.xcelias.com/private', qrcode), /must use HTTPS/);
  assert.throws(() => createQrDataUrl(input, null), /encoder is unavailable/);
});

test('passes the full URL to a local encoder and does not make any network request', () => {
  let captured;
  const fakeEncoder = (version, correction) => {
    assert.equal(version, 0);
    assert.equal(correction, 'Q');
    return {
      addData(value, mode) { captured = {value, mode}; },
      make() {},
      createDataURL(cellSize, margin) {
        assert.equal(cellSize, 6);
        assert.equal(margin, 4);
        return 'data:image/gif;base64,AA==';
      },
    };
  };
  const link = 'https://join.xcelias.com/red-academy/trainer-activities/#/room/ABCDEFGHJK';
  assert.equal(createQrDataUrl(link, fakeEncoder), 'data:image/gif;base64,AA==');
  assert.deepEqual(captured, {value: link, mode: 'Byte'});
});
