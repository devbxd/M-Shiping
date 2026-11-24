// Turns a supplier cost (product + estimated shipping to Lebanon) into our shelf price.
// Rule: flat margin per item, rounded up to the next $x.x9 so it never drops below MARGIN.
export const MARGIN = 3.5; // USD earned per item

export function shelfPrice(cost) {
  const target = cost + MARGIN;
  const tenths = Math.ceil(Math.round((target + 0.01) * 1000) / 100); // next 10-cent step
  return +(tenths / 10 - 0.01).toFixed(2);
}
