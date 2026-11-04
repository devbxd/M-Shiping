// Post-processes data/products.json: removes repeated words in titles and
// drops descriptions that only repeat the title. Run after any import.
import fs from "node:fs";
const file = "data/products.json";
const items = JSON.parse(fs.readFileSync(file, "utf8"));
const dedupe = (t) => {
  const seen = new Set();
  return t.split(" ").filter((w) => {
    const k = w.toLowerCase();
    if (k.length > 2 && seen.has(k)) return false;
    seen.add(k);
    return true;
  }).join(" ");
};
for (const p of items) {
  p.title = dedupe(p.title).replace(/^./, (c) => c.toUpperCase());
  if (!p.description || p.description.trim().toLowerCase().startsWith(p.title.toLowerCase().slice(0, 25))) p.description = "";
}
fs.writeFileSync(file, JSON.stringify(items));
console.log(`Tidied ${items.length} products`);
