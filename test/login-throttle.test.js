import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLockedOut, recordFailure, clearFailures } from '../src/core/auth/login-throttle.js';
import { LOGIN } from '../src/core/constants.js';

test('locks out after MAX_FAILURES within the window', () => {
  const t0 = 1_000_000;
  for (let i = 0; i < LOGIN.MAX_FAILURES; i++) {
    assert.equal(isLockedOut('a', t0 + i), false);
    recordFailure('a', t0 + i);
  }
  assert.equal(isLockedOut('a', t0 + LOGIN.MAX_FAILURES), true);
});

test('lockout expires after the window', () => {
  const t0 = 2_000_000;
  for (let i = 0; i < LOGIN.MAX_FAILURES; i++) recordFailure('b', t0);
  assert.equal(isLockedOut('b', t0 + 1), true);
  assert.equal(isLockedOut('b', t0 + LOGIN.WINDOW_MS + 1), false);
});

test('keys are tracked independently', () => {
  const t0 = 3_000_000;
  for (let i = 0; i < LOGIN.MAX_FAILURES; i++) recordFailure('c', t0);
  assert.equal(isLockedOut('c', t0 + 1), true);
  assert.equal(isLockedOut('d', t0 + 1), false);
});

test('clearFailures resets the counter', () => {
  const t0 = 4_000_000;
  for (let i = 0; i < LOGIN.MAX_FAILURES; i++) recordFailure('e', t0);
  assert.equal(isLockedOut('e', t0 + 1), true);
  clearFailures('e');
  assert.equal(isLockedOut('e', t0 + 1), false);
});
