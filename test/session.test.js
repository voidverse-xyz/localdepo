import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SESSION_SECRET = 'unit-test-session-secret-at-least-32-bytes';
process.env.ADMIN_PASSWORD = 'hunter2';

const { createToken, verifyToken, checkPassword } = await import('../src/core/auth/session.js');

test('a freshly created token verifies', () => {
  assert.equal(verifyToken(createToken()), true);
});

test('a tampered token fails', () => {
  const token = createToken();
  assert.equal(verifyToken(token + 'x'), false);
  assert.equal(verifyToken('admin.9999999999.bogus'), false);
});

test('malformed Unicode signatures fail without throwing', () => {
  const token = createToken();
  const lastDot = token.lastIndexOf('.');
  const payload = token.slice(0, lastDot);
  const signatureLength = token.length - lastDot - 1;
  const signature = 'é'.repeat(signatureLength);

  assert.equal(verifyToken(`${payload}.${signature}`), false);
});

test('an expired token fails', () => {
  assert.equal(verifyToken(createToken(-10)), false);
});

test('checkPassword compares against ADMIN_PASSWORD', () => {
  assert.equal(checkPassword('hunter2'), true);
  assert.equal(checkPassword('wrong'), false);
  assert.equal(checkPassword(''), false);
});

test('non-string passwords are rejected without coercion', () => {
  for (const value of [null, 123, {}, { toString: null }, ['hunter2']]) {
    assert.equal(checkPassword(value), false);
  }
});

test('missing and example passwords disable login and existing sessions', () => {
  const original = process.env.ADMIN_PASSWORD;
  const token = createToken();
  try {
    for (const value of ['', ' ', 'changeme', ' CHANGEME ']) {
      process.env.ADMIN_PASSWORD = value;
      assert.equal(checkPassword(value), false);
      assert.equal(verifyToken(token), false);
      assert.throws(() => createToken(), /Configure/);
    }
    delete process.env.ADMIN_PASSWORD;
    assert.equal(verifyToken(token), false);
  } finally {
    process.env.ADMIN_PASSWORD = original;
  }
});

test('missing, short, and example signing secrets fail closed', () => {
  const original = process.env.SESSION_SECRET;
  const token = createToken();
  try {
    for (const value of [
      '',
      'x'.repeat(31),
      `x${' '.repeat(31)}`,
      ' '.repeat(32),
      'please-change-this-to-a-long-random-string',
      'please-change-me-to-a-long-random-string',
    ]) {
      process.env.SESSION_SECRET = value;
      const payload = 'admin.9999999999';
      const signature = crypto.createHmac('sha256', value).update(payload).digest('base64url');
      assert.equal(checkPassword('hunter2'), false);
      assert.equal(verifyToken(token), false);
      assert.equal(verifyToken(`${payload}.${signature}`), false);
      assert.throws(() => createToken(), /Configure/);
    }
    delete process.env.SESSION_SECRET;
    assert.equal(checkPassword('hunter2'), false);
    assert.equal(verifyToken(token), false);
  } finally {
    process.env.SESSION_SECRET = original;
  }
});
