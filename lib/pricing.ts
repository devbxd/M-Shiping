// Same rule as scripts/pricing.mjs, usable from the app with a custom margin.
export const DEFAULT_MARGIN = 3.5;
export const shippingEstimate = (grams?: number) => 2.5 + (grams || 300) * 0.012;

export function shelfPrice(cost: number, margin = DEFAULT_MARGIN) {
  const target = cost + margin;
  const tenths = Math.ceil(Math.round((target + 0.01) * 1000) / 100);
  return +(tenths / 10 - 0.01).toFixed(2);
}
