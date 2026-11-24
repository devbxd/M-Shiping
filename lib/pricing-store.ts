import { kvGet, kvSet } from "./kv";

// Per-product pricing decisions and live supplier price history (key "pricing").
export type PricePoint = { at: string; cost: number; vcosts?: Record<string, number> };
export type PricingEntry = { margin?: number; history?: PricePoint[] };
export type PricingData = Record<string, PricingEntry>;

// allProducts() is synchronous, so pricing lives in memory and is refreshed by
// ensurePricing(), which every page / route that shows prices awaits first.
let cache: { at: number; data: PricingData; version: number } = { at: 0, data: {}, version: 0 };
const TTL = 15_000;

export async function ensurePricing(force = false) {
  if (!force && Date.now() - cache.at < TTL) return;
  const data = await kvGet<PricingData>("pricing", {});
  cache = { at: Date.now(), data, version: cache.version + 1 };
}

export const readPricing = () => cache.data;
export const pricingVersion = () => cache.version;

export async function updatePricing(id: string, fn: (e: PricingEntry) => PricingEntry) {
  await ensurePricing(true);
  const data = { ...cache.data, [id]: fn({ ...(cache.data[id] ?? {}) }) };
  await kvSet("pricing", data);
  cache = { at: Date.now(), data, version: cache.version + 1 };
  return data[id];
}
