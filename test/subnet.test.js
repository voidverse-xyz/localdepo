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
