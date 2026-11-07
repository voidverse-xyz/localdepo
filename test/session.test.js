import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SESSION_SECRET = 'test-secret';
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
