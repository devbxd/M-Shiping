import fs from "node:fs";
import path from "node:path";
import type { Product } from "./types";
import { readPricing, pricingVersion, type PricingEntry } from "./pricing-store";
import { DEFAULT_MARGIN, shelfPrice } from "./pricing";

const FILE = path.join(process.cwd(), "data", "products.json");

let cache: { key: string; items: Product[] } | null = null;

// Applies a custom margin and/or the latest live supplier cost.
function applyPricing(p: Product, e: PricingEntry): Product {
  const margin = e.margin ?? DEFAULT_MARGIN;
  const live = e.history?.at(-1);
  if (p.variants?.length) {
    const variants = p.variants.map((v) => {
      const cost = live?.vcosts?.[v.vid] ?? v.cost;
      return { ...v, cost, price: shelfPrice(cost, margin) };
    });
    const cheapest = variants.reduce((a, b) => (b.price < a.price ? b : a));
    return { ...p, variants, price: cheapest.price, cost: cheapest.cost };
  }
  const cost = live?.cost ?? p.cost;
  return { ...p, cost, price: shelfPrice(cost, margin) };
}

export function allProducts(): Product[] {
  if (!fs.existsSync(FILE)) return [];
  const key = `${fs.statSync(FILE).mtimeMs}:${pricingVersion()}`;
  if (!cache || cache.key !== key) {
    const raw: Product[] = JSON.parse(fs.readFileSync(FILE, "utf8"));
    const pricing = readPricing();
    cache = { key, items: raw.map((p) => (pricing[p.id] ? applyPricing(p, pricing[p.id]) : p)) };
  }
  return cache.items;
}

export function getProduct(id: string) {
  return allProducts().find((p) => p.id === id);
}

export type Sort = "new" | "price-asc" | "price-desc" | "rating";

export function queryProducts(opts: {
  department?: string;
  category?: string;
  q?: string;
  sort?: Sort;
  max?: number;
  page?: number;
  perPage?: number;
}) {
  let list = allProducts();
  if (opts.department) list = list.filter((p) => p.department === opts.department);
  if (opts.category) list = list.filter((p) => p.category === opts.category);
  if (opts.max) list = list.filter((p) => p.price <= opts.max!);
  if (opts.q) {
    const terms = opts.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((p) => {
      const hay = `${p.title} ${p.brand ?? ""} ${p.category}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  const sorted = [...list];
  switch (opts.sort) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0));
      break;
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const perPage = opts.perPage ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  return {
    total: sorted.length,
    pages: Math.max(1, Math.ceil(sorted.length / perPage)),
    page,
    items: sorted.slice((page - 1) * perPage, page * perPage),
  };
}

export function categoriesOf(department?: string) {
  const counts = new Map<string, number>();
  for (const p of allProducts()) {
    if (department && p.department !== department) continue;
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function departmentCounts() {
  const counts: Record<string, number> = {};
  for (const p of allProducts()) counts[p.department] = (counts[p.department] ?? 0) + 1;
  return counts;
}
