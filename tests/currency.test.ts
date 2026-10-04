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

test('adds decimal amounts exactly and validates unfinished or unsafe expressions', () => {
  assert.equal(parseAmount('7 + 3 + 2.50'), 12.5);
  assert.equal(parseAmount('0.1 + 0.2'), 0.3);
  assert.equal(parseAmount('0 + 0'), 0);
  assert.equal(parseAmount('999999999.99 + 0.01'), 1000000000);
  for (const value of [
    '7 +',
    '+ 7',
    '7 ++ 3',
    '7 - 3',
    '7 * 3',
    '1 + NaN',
    '1.001 + 2',
    '1000000000 + 0.01',
  ])
    assert.equal(parseAmount(value), null);
  assert.equal(formatINR(parseAmount('7 + 3')! * 122), '₹1,220.00');
  assert.equal(formatINR(parseAmount('7 + 3')! * 92.5), '₹925.00');
});

test('validates GBP reference quotes without confusing EUR', () => {
  const row = { base: 'GBP', quote: 'INR', rate: 122, date: '2026-10-04' };
  assert.deepEqual(validateRate([row], 'GBP'), row);
  assert.throws(() => validateRate([row], 'EUR'));
});
