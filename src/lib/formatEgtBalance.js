/** Compact balance display (aligned with marketplace `convertToInternationalCurrencySystem`). */
export function formatEgtBalanceDisplay(value) {
  const n = Math.abs(Number(value));
  if (!Number.isFinite(n)) return "0";
  if (n >= 1.0e15) return `${(n / 1.0e15).toFixed(1)}Q`;
  if (n >= 1.0e12) return `${(n / 1.0e12).toFixed(1)}T`;
  if (n >= 1.0e9) return `${(n / 1.0e9).toFixed(1)}B`;
  if (n >= 1.0e6) return `${(n / 1.0e6).toFixed(1)}M`;
  if (n >= 1.0e3) return `${(n / 1.0e3).toFixed(1)}K`;
  return n.toFixed(1);
}
