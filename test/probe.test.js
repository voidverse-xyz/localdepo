import { test } from 'node:test';
import assert from 'node:assert/strict';
import { httpProbe } from '../src/core/scanner/probe.js';

test('httpProbe captures a short response and its headers', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Jellyfin', {
    status: 200,
    headers: { 'X-Service': 'media' },
  }));

  const result = await httpProbe('192.0.2.1', 8096);

  assert.equal(result.open, true);
  assert.equal(result.status, 200);
  assert.equal(result.headers['x-service'], 'media');
  assert.equal(result.body, 'Jellyfin');
});

test('httpProbe stops reading and cancels the body at the snippet limit', async (t) => {
  let pulls = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      pulls += 1;
      if (pulls > 8) {
        controller.close();
        return;
      }
      controller.enqueue(new Uint8Array(1024).fill(65));
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  t.mock.method(globalThis, 'fetch', async () => new Response(body));

  const result = await httpProbe('192.0.2.1', 8096);

  assert.equal(result.body, 'A'.repeat(4096));
  assert.equal(pulls, 4);
  assert.equal(cancelled, true);
  assert.equal(body.locked, false);
});

test('httpProbe limits a single oversized chunk', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('B'.repeat(8192)));

  const result = await httpProbe('192.0.2.1', 8096);

  assert.equal(result.body, 'B'.repeat(4096));
});

test('httpProbe decodes UTF-8 characters split across chunks', async (t) => {
  const bytes = new TextEncoder().encode('Media café');
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.subarray(0, bytes.length - 1));
      controller.enqueue(bytes.subarray(bytes.length - 1));
      controller.close();
    },
  });
  t.mock.method(globalThis, 'fetch', async () => new Response(body));

  const result = await httpProbe('192.0.2.1', 8096);

  assert.equal(result.body, 'Media café');
});

test('httpProbe handles responses without a body', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));

  const result = await httpProbe('192.0.2.1', 8096);

  assert.equal(result.status, 204);
  assert.equal(result.body, '');
});

test('httpProbe preserves an open port when HTTP fails', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('connection reset');
  });

  const result = await httpProbe('192.0.2.1', 8096);

  assert.deepEqual(result, { host: '192.0.2.1', port: 8096, open: true });
});

test('httpProbe releases the response reader after a body error', async (t) => {
  const body = new ReadableStream({
    pull(controller) {
      controller.error(new Error('body interrupted'));
    },
  });
  t.mock.method(globalThis, 'fetch', async () => new Response(body));

  const result = await httpProbe('192.0.2.1', 8096);

  assert.equal(result.open, true);
  assert.equal(result.status, 200);
  assert.equal(result.body, undefined);
  assert.equal(body.locked, false);
});

test('httpProbe aborts a stalled response body at the timeout', async (t) => {
  let aborted = false;
  let body;
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    body = new ReadableStream({
      start(controller) {
        signal.addEventListener('abort', () => {
          aborted = true;
          controller.error(signal.reason);
        }, { once: true });
      },
    });
    return new Response(body);
  });

  const result = await httpProbe('192.0.2.1', 8096, 10);

  assert.equal(aborted, true);
  assert.equal(result.open, true);
  assert.equal(body.locked, false);
});
