import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatINR, parseAmount, validateRate } from '../src/currency.ts';

test('accepts zero and decimal amounts; rejects invalid or excessive values', () => {
  assert.equal(parseAmount('0'), 0);
  assert.equal(parseAmount('1250.50'), 1250.5);
  for (const value of ['', '.', '-1', 'Infinity', '1e3', '1.234', '1000000001'])
    assert.equal(parseAmount(value), null);
});
test('validates currency pair and rejects missing, invalid, or nonpositive rates', () => {
  const row = { base: 'USD', quote: 'INR', rate: 90, date: '2026-10-02' };
  assert.deepEqual(validateRate([row], 'USD'), row);
  for (const data of [
    [],
    {},
    [{ ...row, rate: 0 }],
    [{ ...row, rate: NaN }],
    [{ ...row, quote: 'EUR' }],
  ]) {
    assert.throws(() => validateRate(data, 'USD'));
  }
  assert.throws(() => validateRate([row], 'EUR'));
});
test('formats conversion results using Indian digit grouping', () => {
  assert.equal(formatINR(1250.5 * 90), '₹1,12,545.00');
  assert.equal(formatINR(0), '₹0.00');
});
