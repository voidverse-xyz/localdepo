import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeServiceName,
  normalizeServiceUrl,
  normalizeIcon,
  normalizeColor,
  normalizeOpacity,
  sanitizeGridItems,
  sanitizeBackground,
} from '../src/core/validation.js';
import { defaultBackground } from '../src/core/storage/schema.js';

test('normalizeServiceName trims and caps length', () => {
  assert.equal(normalizeServiceName('  Jellyfin  '), 'Jellyfin');
  assert.equal(normalizeServiceName(42), '');
  assert.equal(normalizeServiceName('x'.repeat(500)).length, 120);
});

test('normalizeServiceUrl accepts http(s) and adds a missing scheme', () => {
  assert.equal(normalizeServiceUrl('http://10.0.0.5:8096/web'), 'http://10.0.0.5:8096/web');
  assert.equal(normalizeServiceUrl('https://nas.local'), 'https://nas.local');
  assert.equal(normalizeServiceUrl('10.0.0.5:8080'), 'http://10.0.0.5:8080');
  assert.equal(normalizeServiceUrl('localhost:3000'), 'http://localhost:3000');
  assert.equal(normalizeServiceUrl('  nas.local/admin '), 'http://nas.local/admin');
});

test('normalizeServiceUrl rejects non-http schemes and garbage', () => {
  assert.equal(normalizeServiceUrl('javascript:alert(1)'), null);
  assert.equal(normalizeServiceUrl('file:///etc/passwd'), null);
  assert.equal(normalizeServiceUrl(''), null);
  assert.equal(normalizeServiceUrl(null), null);
  assert.equal(normalizeServiceUrl('http://'), null);
});

test('normalizeIcon allows http(s), same-origin paths, and data:image URIs', () => {
  assert.equal(normalizeIcon('https://x.test/icon.png'), 'https://x.test/icon.png');
  assert.equal(normalizeIcon('/uploads/abc.png'), '/uploads/abc.png');
  assert.equal(normalizeIcon('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
});

test('normalizeIcon drops unsafe or malformed references', () => {
  assert.equal(normalizeIcon('javascript:alert(1)'), '');
  assert.equal(normalizeIcon('data:text/html,<script>'), '');
  assert.equal(normalizeIcon('//evil.test/x.png'), '');
  assert.equal(normalizeIcon(123), '');
});

test('normalizeColor accepts only #rrggbb', () => {
  assert.equal(normalizeColor('#a1B2c3'), '#a1B2c3');
  assert.equal(normalizeColor('red'), '');
  assert.equal(normalizeColor('#fff'), '');
  assert.equal(normalizeColor('#123456; background: url(x)'), '');
});

test('normalizeOpacity clamps to an integer percent', () => {
  assert.equal(normalizeOpacity(40.6), 41);
  assert.equal(normalizeOpacity(-5), 0);
  assert.equal(normalizeOpacity(400), 100);
  assert.equal(normalizeOpacity('nope'), 100);
});

test('sanitizeGridItems keeps only well-formed items and clamps geometry', () => {
  const items = sanitizeGridItems([
    { i: 'a', x: 2, y: 1, w: 5, h: 2, junk: 'dropped' },
    { i: 'b', x: 99, y: -4, w: 0, h: 2 },
    { i: 42, x: 0, y: 0, w: 1, h: 1 }, // non-string id: dropped
    { i: 'c', x: 'NaN', y: 0, w: 1, h: 1 }, // non-finite: dropped
  ]);
  assert.deepEqual(items, [
    { i: 'a', x: 2, y: 1, w: 5, h: 2 },
    { i: 'b', x: 9, y: 0, w: 1, h: 2 },
  ]);
});

test('sanitizeGridItems returns null for non-arrays', () => {
  assert.equal(sanitizeGridItems(undefined), null);
  assert.equal(sanitizeGridItems({}), null);
  assert.deepEqual(sanitizeGridItems([]), []);
});

test('sanitizeBackground clamps values and keeps current on invalid input', () => {
  const current = defaultBackground();
  const out = sanitizeBackground(
    {
      color: { enabled: false, value: '#101010' },
      image: { path: '/uploads/ok.png', blur: 999, fit: 'bogus' },
      effect: { type: 'rain', options: { density: '0.4', evil: 'nope' } },
      overlay: { dim: 5, blur: -3 },
    },
    current,
  );
  assert.equal(out.color.enabled, false);
  assert.equal(out.color.value, '#101010');
  assert.equal(out.image.path, '/uploads/ok.png');
  assert.equal(out.image.blur, 40);
  assert.equal(out.image.fit, current.image.fit);
  assert.equal(out.effect.type, 'rain');
  assert.deepEqual(out.effect.options, { density: 0.4 });
  assert.equal(out.overlay.dim, 1);
  assert.equal(out.overlay.blur, 0);
});

test('sanitizeBackground rejects image paths outside /uploads', () => {
  const current = defaultBackground();
  const out = sanitizeBackground({ image: { path: 'https://evil.test/x.png' } }, current);
  assert.equal(out.image.path, current.image.path);
  const traversal = sanitizeBackground({ image: { path: '/uploads/../config.json' } }, current);
  assert.equal(traversal.image.path, current.image.path);
});
