// Re-applies scripts/pricing.mjs to every product and variant in data/products.json.
// Run after changing the margin: npm run reprice
import fs from "node:fs";
import { shelfPrice } from "./pricing.mjs";

const file = "data/products.json";
const items = JSON.parse(fs.readFileSync(file, "utf8"));
let before = 0;
let after = 0;
for (const p of items) {
  before += p.price;
  if (p.variants?.length) {
    for (const v of p.variants) v.price = shelfPrice(v.cost);
    p.price = Math.min(...p.variants.map((v) => v.price));
    p.cost = p.variants.find((v) => v.price === p.price).cost;
  } else {
    p.price = shelfPrice(p.cost);
  }
  p.compareAt = undefined;
  after += p.price;
}
fs.writeFileSync(file + ".tmp", JSON.stringify(items));
fs.renameSync(file + ".tmp", file);
console.log(`Repriced ${items.length} products. Average price $${(before / items.length).toFixed(2)} -> $${(after / items.length).toFixed(2)}`);
