import { allProducts } from "./products";
import type { Product } from "./types";

// Market view per category, from the CJ "number of stores selling it" signal.
export type CategoryStats = {
  name: string;
  count: number;
  demand: number[]; // sorted asc
  prices: number[]; // sorted asc
  maxDemand: number;
};

let cache: { items: Product[]; stats: Map<string, CategoryStats> } | null = null;

export function categoryStats(): Map<string, CategoryStats> {
  const items = allProducts();
  if (cache && cache.items === items) return cache.stats;
  const groups = new Map<string, Product[]>();
  for (const p of items) {
    const key = `${p.department}|${p.category}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }
  const stats = new Map<string, CategoryStats>();
  for (const [key, list] of groups) {
    const demand = list.map((p) => p.reviews ?? 0).sort((a, b) => a - b);
    stats.set(key, {
      name: list[0].category,
      count: list.length,
      demand,
      prices: list.map((p) => p.price).sort((a, b) => a - b),
      maxDemand: demand.at(-1) ?? 0,
    });
  }
  cache = { items, stats };
  return stats;
}

export const statsFor = (p: Product) => categoryStats().get(`${p.department}|${p.category}`)!;

// share of products in the category with lower value (0–100)
export function percentile(sorted: number[], v: number) {
  if (sorted.length < 2) return 100;
  let lo = 0;
  while (lo < sorted.length && sorted[lo] < v) lo++;
  return Math.round((lo / (sorted.length - 1)) * 100);
}

export const median = (sorted: number[]) => sorted[Math.floor(sorted.length / 2)] ?? 0;

// global demand rank (1 = most listed product in the whole catalog)
let rankCache: { items: Product[]; rank: Map<string, number> } | null = null;
export function demandRank(id: string) {
  const items = allProducts();
  if (!rankCache || rankCache.items !== items) {
    const sorted = [...items].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    rankCache = { items, rank: new Map(sorted.map((p, i) => [p.id, i + 1])) };
  }
  return rankCache.rank.get(id) ?? 0;
}
