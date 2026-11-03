// Turns a supplier cost into our shelf price. Tune MARKUP / HANDLING to taste.
export const MARKUP = 1.45; // +45% on supplier cost
export const HANDLING = 2; // flat per item, covers forwarding & packaging

export function shelfPrice(cost) {
  const raw = cost * MARKUP + HANDLING;
  return Math.max(1.99, Math.ceil(raw) - 0.01);
}
