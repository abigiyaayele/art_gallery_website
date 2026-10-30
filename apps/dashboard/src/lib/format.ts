export function money(cents: number | null | undefined, currency = 'USD') {
  if (cents === null || cents === undefined) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

export const toCents = (value: string) => {
  const n = Number(value.replace(/[^0-9.]/g, ''));
  return value.trim() === '' || Number.isNaN(n) ? null : Math.round(n * 100);
};

export const fromCents = (cents: number | null | undefined) => (cents === null || cents === undefined ? '' : String(cents / 100));

export function date(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}
