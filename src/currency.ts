export type Currency = 'USD' | 'EUR';
export type Rate = { base: Currency; quote: 'INR'; date: string; rate: number };

export function parseAmount(value: string): number | null {
  if (!/^\d*(\.\d{0,2})?$/.test(value) || value === '' || value === '.')
    return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount <= 1_000_000_000 ? amount : null;
}

export function validateRate(data: unknown, base: Currency): Rate {
  if (!Array.isArray(data)) throw new Error('Invalid exchange-rate response');
  const row = data.find(item => item?.base === base && item?.quote === 'INR');
  if (
    !row ||
    typeof row.rate !== 'number' ||
    !Number.isFinite(row.rate) ||
    row.rate <= 0 ||
    typeof row.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.date)
  ) {
    throw new Error('No valid exchange rate available');
  }
  return { base, quote: 'INR', date: row.date, rate: row.rate };
}

export async function fetchRate(
  base: Currency,
  signal?: AbortSignal,
): Promise<Rate> {
  const response = await fetch(
    `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=INR`,
    { signal },
  );
  if (!response.ok) throw new Error('Exchange-rate service is unavailable');
  return validateRate(await response.json(), base);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
