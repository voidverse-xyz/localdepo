import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOGIN } from '../../src/core/constants.js';

const baseUrl = process.env.TEST_BASE_URL;
const password = process.env.TEST_ADMIN_PASSWORD;
if (!baseUrl || !password) {
  throw new Error('Set TEST_BASE_URL and TEST_ADMIN_PASSWORD for a disposable test server');
}

test('upgraded routes preserve authentication, persistence, and uploads', async (t) => {
  await t.test('all write routes reject unauthenticated requests', async () => {
    for (const [path, method] of [
      ['/api/services', 'POST'],
      ['/api/services', 'PUT'],
      ['/api/services?id=missing', 'DELETE'],
      ['/api/layout', 'PUT'],
      ['/api/settings', 'PUT'],
      ['/api/upload', 'POST'],
      ['/api/scan', 'POST'],
    ]) {
      const response = await fetch(new URL(path, baseUrl), { method });
      assert.equal(response.status, 401, `${method} ${path}`);
      assert.deepEqual(await response.json(), { error: 'unauthorized' });
    }
    const response = await fetch(new URL('/api/auth', baseUrl));
    assert.deepEqual(await response.json(), { authed: false });
  });

  const login = await fetch(new URL('/api/auth', baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const headers = { cookie, 'content-type': 'application/json' };
  const auth = await fetch(new URL('/api/auth', baseUrl), { headers });
  assert.deepEqual(await auth.json(), { authed: true });

  await t.test('authenticated service and layout writes persist', async () => {
    const added = await fetch(new URL('/api/services', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Upgrade test', url: 'https://example.test' }),
    });
    assert.equal(added.status, 200);
    const { service } = await added.json();
    try {
      const updated = await fetch(new URL('/api/services', baseUrl), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: service.id, name: 'Updated upgrade test' }),
      });
      assert.equal(updated.status, 200);
      const result = await updated.json();
      assert.equal(result.services.find((item) => item.id === service.id).name, 'Updated upgrade test');

      const grid = [{ i: service.id, x: 0, y: 0, w: 5, h: 2 }];
      const saved = await fetch(new URL('/api/layout', baseUrl), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ layout: { grid } }),
      });
      assert.equal(saved.status, 200);
      const response = await fetch(new URL('/api/layout', baseUrl));
      const config = await response.json();
      assert.deepEqual(config.layout.grid, grid);
    } finally {
      const removed = await fetch(new URL(`/api/services?id=${service.id}`, baseUrl), {
        method: 'DELETE',
        headers,
      });
      assert.equal(removed.status, 200);
    }
  });

  await t.test('uploaded images resolve through async route parameters', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    );
    const form = new FormData();
    form.append('file', new Blob([png], { type: 'image/png' }), 'pixel.png');
    const uploaded = await fetch(new URL('/api/upload', baseUrl), {
      method: 'POST',
      headers: { cookie },
      body: form,
    });
    assert.equal(uploaded.status, 200);
    const { path } = await uploaded.json();
    const image = await fetch(new URL(path, baseUrl));
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), 'image/png');
    const bytes = await image.arrayBuffer();
    assert.deepEqual(Buffer.from(bytes), png);
  });

  await t.test('concurrent attempts and changing forwarded headers share the admin login limit', async () => {
    const attempts = Array.from({ length: LOGIN.MAX_FAILURES + 5 }, async (_, i) => {
      const response = await fetch(new URL('/api/auth', baseUrl), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': `192.0.2.${i + 1}`,
          'x-real-ip': `198.51.100.${i + 1}`,
          forwarded: `for=192.0.2.${i + 1}`,
        },
        body: JSON.stringify({ password: `${password}-incorrect` }),
      });
      await response.arrayBuffer();
      return response.status;
    });
    const statuses = await Promise.all(attempts);
    assert.equal(statuses.filter((status) => status === 401).length, LOGIN.MAX_FAILURES);
    assert.equal(statuses.filter((status) => status === 429).length, 5);

    const response = await fetch(new URL('/api/auth', baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.1' },
      body: JSON.stringify({ password }),
    });
    assert.equal(response.status, 429);
    await response.arrayBuffer();
  });
});
