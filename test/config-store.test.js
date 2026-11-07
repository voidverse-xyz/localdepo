import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmpDir;

before(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'localdepo-'));
  process.env.DATA_DIR = tmpDir;
});

after(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const store = await import('../src/core/storage/config-store.js');

test('readConfig returns defaults on first run', async () => {
  const config = await store.readConfig();
  assert.equal(config.version, 1);
  assert.deepEqual(config.services, []);
  assert.ok(config.background.color.enabled);
});

test('updateConfig persists changes atomically', async () => {
  await store.updateConfig((cfg) => {
    cfg.services.push({ id: 'a', name: 'A', url: 'http://a', source: 'manual', enabled: true });
  });
  const reread = await store.readConfig();
  assert.equal(reread.services.length, 1);
  assert.equal(reread.services[0].id, 'a');
});

test('concurrent updates do not clobber each other', async () => {
  await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      store.updateConfig((cfg) => {
        cfg.services.push({ id: `c${i}`, name: `C${i}`, url: `http://c${i}`, source: 'manual', enabled: true });
      }),
    ),
  );
  const config = await store.readConfig();
  // 1 from the previous test + 10 here
  assert.equal(config.services.length, 11);
});
