// Fills data/products.json with demo items so the store can be designed and
// tested before the AliExpress API keys arrive. Run: npm run seed:demo
import fs from "node:fs";
import { shelfPrice } from "./pricing.mjs";

const MAP = {
  "womens-dresses": "women", tops: "women", "womens-bags": "women", "womens-jewellery": "women", "womens-watches": "women",
  "mens-shirts": "men", "mens-watches": "men",
  "mens-shoes": "shoes", "womens-shoes": "shoes",
  smartphones: "tech", laptops: "tech", tablets: "tech", "mobile-accessories": "tech",
  beauty: "beauty", fragrances: "beauty", "skin-care": "beauty",
  furniture: "home", "home-decoration": "home", "kitchen-accessories": "home",
  "sports-accessories": "sport",
  sunglasses: "accessories",
};
const pretty = (s) => s.replace(/^(womens|mens)-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const res = await fetch("https://dummyjson.com/products?limit=0");
const { products } = await res.json();
const out = [];
for (const p of products) {
  const department = MAP[p.category];
  if (!department) continue;
  const cost = +(p.price * 0.55).toFixed(2); // pretend supplier cost
  const price = shelfPrice(cost);
  out.push({
    id: "d" + p.id,
    title: p.title,
    brand: p.brand,
    department,
    category: pretty(p.category),
    price,
    compareAt: p.discountPercentage > 12 ? Math.ceil(price / (1 - p.discountPercentage / 100)) - 0.01 : undefined,
    cost,
    supplier: "demo",
    images: p.images?.length ? p.images : [p.thumbnail],
    rating: p.rating,
    reviews: p.reviews?.length ?? 0,
    description: p.description,
    createdAt: new Date(Date.now() - p.id * 3600e3).toISOString(),
  });
}
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/products.json", JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} demo products`);
