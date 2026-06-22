import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identify } from '../src/core/scanner/fingerprint.js';

test('identifies Jellyfin from body on its default port', () => {
  const probe = { host: '10.0.0.5', port: 8096, open: true, status: 200, body: '<title>Jellyfin</title>' };
  const def = identify(probe);
  assert.ok(def);
  assert.equal(def.id, 'jellyfin');
});

test('identifies a service on a remapped port via content', () => {
  const probe = { host: '10.0.0.5', port: 9999, open: true, status: 200, body: 'Welcome to Sonarr' };
  const def = identify(probe);
  assert.ok(def);
  assert.equal(def.id, 'sonarr');
});

test('returns null when nothing matches', () => {
  const probe = { host: '10.0.0.5', port: 12345, open: true, status: 200, body: 'random nginx page' };
  assert.equal(identify(probe), null);
});
