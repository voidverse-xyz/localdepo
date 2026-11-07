import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeDiscovered } from '../src/core/services/merge.js';

const discovered = [
  { id: 'jellyfin-10.0.0.5-8096', url: 'http://10.0.0.5:8096/web', name: 'Jellyfin' },
  { id: 'sonarr-10.0.0.5-8989', url: 'http://10.0.0.5:8989', name: 'Sonarr' },
];

test('adds new discovered services', () => {
  const merged = mergeDiscovered([], discovered);
  assert.equal(merged.length, 2);
});

test('does not duplicate by id or url', () => {
  const existing = [{ id: 'jellyfin-10.0.0.5-8096', url: 'http://10.0.0.5:8096/web', name: 'Jellyfin' }];
  const merged = mergeDiscovered(existing, discovered);
  assert.equal(merged.length, 2); // only sonarr is added
});

test('skips dismissed discovered services', () => {
  const merged = mergeDiscovered([], discovered, ['sonarr-10.0.0.5-8989']);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'jellyfin-10.0.0.5-8096');
});

test('preserves manual services', () => {
  const manual = [{ id: 'm1', url: 'http://x', name: 'Manual', source: 'manual' }];
  const merged = mergeDiscovered(manual, discovered);
  assert.equal(merged.length, 3);
  assert.ok(merged.find((s) => s.id === 'm1'));
});

test('keeps the first new service when a discovery batch repeats an id', () => {
  const first = { id: 'service', url: 'http://first.test', name: 'First' };
  const duplicate = { id: 'service', url: 'http://second.test', name: 'Second' };

  assert.deepEqual(mergeDiscovered([], [first, duplicate]), [first]);
});

test('keeps the first new service when a discovery batch repeats a url', () => {
  const first = { id: 'first', url: 'http://service.test', name: 'First' };
  const duplicate = { id: 'second', url: first.url, name: 'Second' };

  assert.deepEqual(mergeDiscovered([], [first, duplicate]), [first]);
});
