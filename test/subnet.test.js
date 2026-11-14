import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  netmaskToPrefix,
  ipToInt,
  intToIp,
  expandCidr,
} from '../src/core/scanner/subnet.js';

test('netmaskToPrefix converts dotted masks to prefix length', () => {
  assert.equal(netmaskToPrefix('255.255.255.0'), 24);
  assert.equal(netmaskToPrefix('255.255.0.0'), 16);
  assert.equal(netmaskToPrefix('255.255.255.252'), 30);
});

test('ipToInt / intToIp round-trip', () => {
  for (const ip of ['0.0.0.0', '192.168.1.1', '255.255.255.255', '10.0.0.7']) {
    assert.equal(intToIp(ipToInt(ip)), ip);
  }
});

test('expandCidr excludes network + broadcast for /24', () => {
  const hosts = expandCidr('192.168.1.0/24');
  assert.equal(hosts.length, 254);
  assert.equal(hosts[0], '192.168.1.1');
  assert.equal(hosts[hosts.length - 1], '192.168.1.254');
});

test('expandCidr respects the max cap', () => {
  const hosts = expandCidr('10.0.0.0/8', 50);
  assert.equal(hosts.length, 50);
});

test('expandCidr rejects malformed input', () => {
  assert.deepEqual(expandCidr('not-a-cidr'), []);
  assert.deepEqual(expandCidr('192.168.1.0/40'), []);
});

test('expandCidr rejects invalid addresses and partially parsed prefixes', () => {
  for (const cidr of [
    '999.0.0.1/32',
    '192.0.2/24',
    'example.test/24',
    '192.0.2.0/24junk',
    '192.0.2.0/24/1',
    '192.0.2.0/24.5',
    '192.0.2.0/-1',
    '192.0.2.0/',
    null,
  ]) {
    assert.deepEqual(expandCidr(cidr), [], String(cidr));
  }
});

test('expandCidr includes both /31 endpoints and the sole /32 host', () => {
  assert.deepEqual(expandCidr('192.0.2.0/31'), ['192.0.2.0', '192.0.2.1']);
  assert.deepEqual(expandCidr('192.0.2.5/32'), ['192.0.2.5']);
  assert.deepEqual(expandCidr('0.0.0.0/0', 2), ['0.0.0.1', '0.0.0.2']);
});
