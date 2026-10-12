import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, SOURCES, normalizeFirmware, lookup, filterGroups } from '../data.mjs';

test('Accepts short versions and real PS5 full-version format without float comparisons', () => {
  assert.equal(normalizeFirmware(' 9.00 '), '9.00');
  assert.equal(normalizeFirmware('9'), '9.00');
  assert.equal(normalizeFirmware('10.1'), '10.10');
  assert.equal(normalizeFirmware('10.01'), '10.01');
  assert.equal(normalizeFirmware('25.02-11.00.00.07-00.00.00.0.1', 'PS5'), '11.00');
  assert.equal(normalizeFirmware('25.02-11.00.00.07', 'PS4'), null);
});

test('Malformed values are rejected instead of becoming a supported version', () => {
  for (const value of ['', '-1', '9.001', '900', '1e1', '11.00junk', '<script>', '0', '11..00', 'Infinity']) assert.ok(lookup('PS4', value).error, value);
  assert.ok(lookup('PS3', '9.00').error);
});

test('PS4 known boundaries keep actual firmware routes distinct', () => {
  assert.equal(lookup('PS4', '9.00').method, 'pOOBs4 + GoldHEN');
  assert.equal(lookup('PS4', '9.03').status, 'partial');
  assert.equal(lookup('PS4', '11.00').status, 'available');
  assert.equal(lookup('PS4', '11.52').entry, 'Blu-ray disc');
  assert.equal(lookup('PS4', '13.00').status, 'available');
  assert.equal(lookup('PS4', '13.02').status, 'unknown');
  assert.equal(lookup('PS4', '13.52').status, 'unknown');
});

test('PS5 exact allowlist exceptions never inherit support from nearby versions', () => {
  assert.equal(lookup('PS5', '4.51').payload, 'ps5-hen');
  assert.equal(lookup('PS5', '4.52').status, 'unknown');
  assert.equal(lookup('PS5', '6.50').entry, 'YouTube app');
  assert.equal(lookup('PS5', '9.05').method, 'Y2JB + Lapse + etaHEN');
  assert.equal(lookup('PS5', '10.01').status, 'available');
  assert.equal(lookup('PS5', '10.20').status, 'partial');
  assert.equal(lookup('PS5', '11.40').status, 'unknown');
  assert.equal(lookup('PS5', '13.60').status, 'partial');
  assert.equal(lookup('PS5', '13.61').status, 'unknown');
  assert.equal(lookup('PS5', '8.99').status, 'unknown');
});

test('Search combines exact version text, console, and support filters', () => {
  assert.ok(filterGroups('PS4', '13.00', 'available').some(g => g.id === 'ps4-poops'));
  assert.equal(filterGroups('PS4', '13.60').length, 0);
  assert.ok(filterGroups('PS5', '13.60', 'partial').some(g => g.id === 'ps5-relapse'));
  assert.equal(filterGroups('all', 'no-such-method').length, 0);
});

test('Each firmware has a single record per console and resolvable primary sources', () => {
  const found = new Set();
  for (const group of GROUPS) {
    assert.ok(group.sources.length > 0);
    for (const key of group.sources) assert.ok(new URL(SOURCES[key].url).protocol === 'https:');
    for (const version of group.versions) {
      const key = `${group.console}/${version}`;
      assert.ok(!found.has(key), `Duplicate ${key}`);
      found.add(key);
      assert.equal(lookup(group.console, version).id, group.id);
    }
  }
});
