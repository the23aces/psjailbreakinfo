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
  for (const version of ['5.07', '7.00', '7.01', '7.50', '7.51', '8.00', '8.01', '8.03', '8.50', '8.52', '9.03', '9.04', '9.50', '9.51']) {
    assert.equal(lookup('PS4', version).status, 'available', version);
    assert.match(lookup('PS4', version).payload, /GoldHEN/, version);
  }
  assert.equal(lookup('PS4', '11.00').status, 'available');
  assert.equal(lookup('PS4', '11.52').entry, 'Blu-ray disc');
  assert.equal(lookup('PS4', '13.00').status, 'available');
  for (const version of ['13.02', '13.04', '13.50', '13.52']) {
    assert.equal(lookup('PS4', version).status, 'available', version);
    assert.equal(lookup('PS4', version).entry, 'Browser', version);
  }
  assert.equal(lookup('PS4', '13.51').status, 'unknown');
  assert.equal(lookup('PS4', '14.00').status, 'unsupported');
});

test('PS5 exact allowlist exceptions never inherit support from nearby versions', () => {
  assert.equal(lookup('PS5', '4.51').payload, 'ps5-hen');
  assert.equal(lookup('PS5', '4.52').status, 'unknown');
  assert.equal(lookup('PS5', '6.50').entry, 'YouTube app');
  assert.equal(lookup('PS5', '9.05').method, 'Y2JB + Lapse + etaHEN');
  assert.equal(lookup('PS5', '10.01').status, 'available');
  for (const version of ['10.20', '10.40', '10.60', '11.40']) {
    const result = lookup('PS5', version);
    assert.equal(result.status, 'available', version);
    assert.match(result.payload, /Kstuff Lite/, version);
  }
  assert.equal(lookup('PS5', '11.40').method, 'WebKit + Poops + Kstuff Lite');
  for (const version of ['11.00', '11.20', '11.60', '12.00', '12.02', '12.20', '12.40', '12.60', '12.70', '13.00', '13.20', '13.40', '13.42', '13.60']) {
    const result = lookup('PS5', version);
    assert.equal(result.status, 'available', version);
    assert.match(result.method, /etaHEN Unified.*community/, version);
    assert.equal(result.hv, 'Not established by these sources', version);
  }
  assert.equal(lookup('PS5', '14.10').status, 'unsupported');
  assert.equal(lookup('PS5', '13.61').status, 'unknown');
  assert.equal(lookup('PS5', '8.99').status, 'unknown');
});

test('Reviewed new releases are unsupported while unlisted inputs stay unverified', () => {
  for (const [consoleName, version] of [['PS4', '14.00'], ['PS5', '14.00'], ['PS5', '14.10']]) {
    const result = lookup(consoleName, version);
    assert.equal(result.status, 'unsupported');
    assert.equal(result.entry, 'Unavailable');
    assert.ok(result.sources.includes(consoleName === 'PS4' ? 'ps4Updates' : 'ps5Updates'));
  }
  assert.equal(lookup('PS5', '26.06-14.10.00.00-00.00.00.0.1').status, 'unsupported');
  assert.equal(lookup('PS4', '14.10').status, 'unknown');
  assert.equal(lookup('PS5', '15.00').status, 'unknown');
  assert.equal(filterGroups('PS4', '', 'unsupported').length, 1);
  assert.deepEqual(filterGroups('PS5', '14.10', 'unsupported').flatMap(g => g.versions), ['14.00', '14.10']);
  assert.equal(filterGroups('PS5', '14.10', 'available').length, 0);
});

test('Search combines exact version text, console, and support filters', () => {
  assert.ok(filterGroups('PS4', '13.00', 'available').some(g => g.id === 'ps4-poops'));
  assert.equal(filterGroups('PS4', '13.60').length, 0);
  assert.ok(filterGroups('PS4', '13.52', 'available').some(g => g.id === 'ps4-13-goldhen'));
  assert.ok(filterGroups('PS5', '13.60', 'available').some(g => g.id === 'ps5-etahen-unified'));
  assert.equal(filterGroups('PS5', '13.60', 'partial').length, 0);
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
