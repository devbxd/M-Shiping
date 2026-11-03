import fs from "node:fs";
import path from "node:path";
import type { Product } from "./types";

const FILE = path.join(process.cwd(), "data", "products.json");

let cache: { mtime: number; items: Product[] } | null = null;

export function allProducts(): Product[] {
  if (!fs.existsSync(FILE)) return [];
  const mtime = fs.statSync(FILE).mtimeMs;
  if (!cache || cache.mtime !== mtime) {
    cache = { mtime, items: JSON.parse(fs.readFileSync(FILE, "utf8")) };
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
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
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
