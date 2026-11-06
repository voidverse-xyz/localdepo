import net from 'node:net';
import { SCAN } from '../constants.js';

const BODY_LIMIT = 4096;

async function readBodySnippet(response) {
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let remaining = BODY_LIMIT;
  let text = '';

  try {
    while (remaining > 0) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value.subarray(0, remaining);
      text += decoder.decode(chunk, { stream: true });
      remaining -= chunk.byteLength;
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Resolve true if a TCP connection to host:port succeeds within the timeout. */
export function tcpCheck(host, port, timeout = SCAN.TCP_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

/** Fetch http://host:port/ and capture status, headers, and a body snippet. */
export async function httpProbe(host, port, timeout = SCAN.HTTP_TIMEOUT_MS) {
  /** @type {import('../types.js').ProbeResult} */
  const result = { host, port, open: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`http://${host}:${port}/`, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'LocalDepo-Scanner' },
    });
    result.status = res.status;
    result.headers = {};
    res.headers.forEach((value, key) => {
      result.headers[key.toLowerCase()] = value;
    });
    result.body = await readBodySnippet(res);
  } catch {
    // Port is open but spoke no (plain) HTTP — matchers can still use `open`.
  } finally {
    clearTimeout(timer);
  }
  return result;
}

/** Full probe: cheap TCP check first, then HTTP only if the port is open. */
export async function probe(host, port) {
  const open = await tcpCheck(host, port);
  if (!open) return { host, port, open: false };
  return httpProbe(host, port);
}
