import os from 'node:os';
import { isIPv4 } from 'node:net';
import { ENV, SCAN } from '../constants.js';

/** "255.255.255.0" -> 24 */
export function netmaskToPrefix(netmask) {
  return netmask
    .split('.')
    .reduce((acc, oct) => acc + ((parseInt(oct, 10).toString(2).match(/1/g) || []).length), 0);
}

export function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => ((acc << 8) + (parseInt(oct, 10) & 255)) >>> 0, 0) >>> 0;
}

export function intToIp(n) {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
}

function maskFromPrefix(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

/** Detect the host's primary non-internal IPv4 subnet as a CIDR string. */
export function detectCidr() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] || []) {
      if (info.family === 'IPv4' && !info.internal) {
        return `${info.address}/${netmaskToPrefix(info.netmask)}`;
      }
    }
  }
  return null;
}

/**
 * Expand a CIDR into individual host IPs (network + broadcast excluded for
 * prefixes <= 30). Capped at `max` to keep scans bounded.
 */
export function expandCidr(cidr, max = SCAN.MAX_HOSTS) {
  if (typeof cidr !== 'string') return [];
  const parts = cidr.split('/');
  if (parts.length !== 2) return [];
  const [ip, prefixStr] = parts;
  if (!isIPv4(ip) || !/^\d{1,2}$/.test(prefixStr)) return [];
  const prefix = Number(prefixStr);
  if (prefix > 32) return [];

  const base = (ipToInt(ip) & maskFromPrefix(prefix)) >>> 0;
  const size = 2 ** (32 - prefix);
  const start = prefix <= 30 ? 1 : 0;
  const end = prefix <= 30 ? size - 1 : size;

  const hosts = [];
  for (let i = start; i < end && hosts.length < max; i++) {
    hosts.push(intToIp((base + i) >>> 0));
  }
  return hosts;
}

/** Hosts to scan: SCAN_CIDR env override, else auto-detected subnet. */
export function getScanTargets() {
  const cidr = process.env[ENV.SCAN_CIDR] || detectCidr();
  return cidr ? expandCidr(cidr) : [];
}
