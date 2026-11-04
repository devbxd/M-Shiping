// Fetches each CJ product's official gallery and its variants (colour / size)
// and stores them in data/products.json. Resumable: already-enriched items are
// skipped, progress is saved every 50 products. Run: npm run enrich:cj
import fs from "node:fs";
import { shelfPrice } from "./pricing.mjs";

for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const FILE = "data/products.json";
const tok = JSON.parse(fs.readFileSync("data/.cj-token.json", "utf8")).token;
const shipping = (grams) => 2.5 + (grams || 300) * 0.012; // keep in sync with import-cj.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let last = 0;
async function query(pid) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = 1150 - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(`${BASE}/product/query?pid=${pid}`, { headers: { "CJ-Access-Token": tok } });
      const json = await res.json();
      if (json?.result) return json.data;
      if (res.status === 429 || json?.code === 1600200) { await sleep(4000); continue; }
      return null;
    } catch {
      await sleep(3000);
    }
  }
  return null;
}

const tidyValue = (v) => String(v).trim().replace(/^./, (c) => c.toUpperCase());

function variantsOf(d, weightFallback) {
  const dims = String(d.productKeyEn || "").split("-").map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const v of d.variants ?? []) {
    const parts = String(v.variantKey || "").split("-").map(tidyValue);
    const price = parseFloat(v.variantSellPrice);
    if (!(price > 0)) continue;
    const grams = parseFloat(v.variantWeight) || weightFallback;
    const cost = +(price + shipping(grams)).toFixed(2);
    out.push({
      vid: v.vid,
      sku: v.variantSku,
      options: dims.length === parts.length ? Object.fromEntries(dims.map((k, i) => [k, parts[i]])) : { Option: parts.join(" / ") },
      image: v.variantImage || undefined,
      cost,
      price: shelfPrice(cost),
    });
  }
  return out;
}

const items = JSON.parse(fs.readFileSync(FILE, "utf8"));
const todo = items.filter((p) => p.supplier === "cj" && !p.enriched);
console.log(`${todo.length} products to enrich`);
let done = 0;

function save() {
  // re-read so concurrent edits (e.g. a tidy run) are not lost
  const fresh = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const byId = new Map(items.map((p) => [p.id, p]));
  for (let i = 0; i < fresh.length; i++) if (byId.get(fresh[i].id)?.enriched) fresh[i] = byId.get(fresh[i].id);
  fs.writeFileSync(FILE + ".tmp", JSON.stringify(fresh));
  fs.renameSync(FILE + ".tmp", FILE);
}

for (const p of todo) {
  const d = await query(p.supplierId);
  if (d) {
    let gallery = d.productImageSet;
    if (typeof gallery === "string") { try { gallery = JSON.parse(gallery); } catch { gallery = [gallery]; } }
    const imgs = [p.images[0], ...(Array.isArray(gallery) ? gallery : [])].filter((u) => typeof u === "string" && u.startsWith("http"));
    p.images = [...new Set(imgs)].slice(0, 8);
    const variants = variantsOf(d, p.weight);
    if (variants.length > 1) {
      p.variants = variants.slice(0, 80);
      // shelf price = cheapest variant that still keeps the margin rule
      p.price = Math.min(...p.variants.map((v) => v.price));
      p.cost = p.variants.find((v) => v.price === p.price).cost;
    }
  }
  p.enriched = true;
  if (++done % 50 === 0) {
    save();
    console.log(`${done}/${todo.length}`);
  }
}
save();
console.log(`Done: ${done} enriched`);
