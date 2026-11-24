import fs from "node:fs";
import path from "node:path";

// Per-product pricing decisions and live supplier price history.
// Stored in data/pricing.json (local). On Vercel the disk is read-only, so
// saving needs a database — see README.
export type PricePoint = { at: string; cost: number; vcosts?: Record<string, number> };
export type PricingEntry = { margin?: number; history?: PricePoint[] };
export type PricingData = Record<string, PricingEntry>;

const FILE = path.join(process.cwd(), "data", "pricing.json");
let cache: { mtime: number; data: PricingData } | null = null;

export function pricingMtime() {
  return fs.existsSync(FILE) ? fs.statSync(FILE).mtimeMs : 0;
}

export function readPricing(): PricingData {
  const mtime = pricingMtime();
  if (!mtime) return {};
  if (!cache || cache.mtime !== mtime) cache = { mtime, data: JSON.parse(fs.readFileSync(FILE, "utf8")) };
  return cache.data;
}

export function updatePricing(id: string, fn: (e: PricingEntry) => PricingEntry) {
  const data = { ...readPricing() };
  data[id] = fn({ ...(data[id] ?? {}) });
  try {
    fs.writeFileSync(FILE + ".tmp", JSON.stringify(data));
    fs.renameSync(FILE + ".tmp", FILE);
  } catch {
    throw new Error("Cannot save here: this host has a read-only disk. Connect a database to save prices online.");
  }
  cache = null;
  return data[id];
}
