import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultManualRates,
  parseExchangeRate,
  restorePreferences,
} from '../src/preferences.ts';

test('uses user supplied USD and GBP presets without inventing a EUR rate', () => {
  assert.equal(defaultManualRates.USD?.rate, 92.5);
  assert.equal(defaultManualRates.GBP?.rate, 122);
  assert.equal(defaultManualRates.EUR, undefined);
});

test('validates positive decimal exchange rates', () => {
  assert.equal(parseExchangeRate('92.5'), 92.5);
  assert.equal(parseExchangeRate('122'), 122);
  for (const value of [
    '',
    '0',
    '-1',
    'Infinity',
    '1e3',
    '7+3',
    '1.1234567',
    '1000001',
  ])
    assert.equal(parseExchangeRate(value), null);
});

test('restores saved mode and edited rates while rejecting corrupted entries', () => {
  const stamp = '2026-10-04T19:00:00Z';
  const saved = {
    mode: 'market',
    rates: {
      USD: { rate: 94, updatedAt: stamp },
      EUR: { rate: 108.5, updatedAt: stamp },
      GBP: { rate: -5 },
    },
  };
  const restored = restorePreferences(JSON.parse(JSON.stringify(saved)));
  assert.equal(restored.mode, 'market');
  assert.equal(restored.rates.USD?.rate, 94);
  assert.equal(restored.rates.EUR?.rate, 108.5);
  assert.equal(restored.rates.USD?.updatedAt, stamp);
  assert.equal(restored.rates.GBP?.rate, 122);
  assert.deepEqual(restorePreferences(null), {
    mode: 'paypal',
    rates: defaultManualRates,
  });
});
