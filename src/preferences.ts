import type { Currency } from './currency';

export type RateMode = 'paypal' | 'market';
export type ManualRate = { rate: number; updatedAt: string | null };
export type ManualRates = Partial<Record<Currency, ManualRate>>;
export const defaultManualRates: ManualRates = {
  USD: { rate: 92.5, updatedAt: null },
  GBP: { rate: 122, updatedAt: null },
};

export function parseExchangeRate(value: string): number | null {
  if (!/^\d+(\.\d{1,6})?$/.test(value.trim())) return null;
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 && rate <= 1000000 ? rate : null;
}

export function restorePreferences(value: unknown): {
  mode: RateMode;
  rates: ManualRates;
} {
  const data = value as { mode?: unknown; rates?: unknown } | null;
  const rates = { ...defaultManualRates };
  if (data && typeof data.rates === 'object' && data.rates !== null) {
    const saved = data.rates as Record<string, ManualRate>;
    for (const currency of ['USD', 'EUR', 'GBP'] as Currency[]) {
      const row = saved[currency];
      if (
        row &&
        typeof row.rate === 'number' &&
        parseExchangeRate(String(row.rate)) !== null
      ) {
        rates[currency] = {
          rate: row.rate,
          updatedAt:
            typeof row.updatedAt === 'string' &&
            Number.isFinite(Date.parse(row.updatedAt))
              ? row.updatedAt
              : null,
        };
      }
    }
  }
  return { mode: data?.mode === 'market' ? 'market' : 'paypal', rates };
}
