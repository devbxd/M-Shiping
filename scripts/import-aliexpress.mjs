// Imports real products through the official AliExpress Affiliate API
// (no HTML scraping: stable, allowed, and every item can actually be ordered
// and shipped to Lebanon because we ask the API for ship_to_country=LB).
//
// 1. Create an app at https://openservice.aliexpress.com (Affiliate API)
// 2. Put ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET / ALIEXPRESS_TRACKING_ID in .env.local
// 3. npm run import:aliexpress            -> uses the keyword plan below
//    npm run import:aliexpress -- tech "gaming mouse" 3   -> one department, one keyword, 3 pages
import fs from "node:fs";
import crypto from "node:crypto";
import { shelfPrice } from "./pricing.mjs";

// --- load .env.local without a dependency
for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const KEY = process.env.ALIEXPRESS_APP_KEY;
const SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACKING = process.env.ALIEXPRESS_TRACKING_ID || "default";
if (!KEY || !SECRET) {
  console.error("Missing ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET in .env.local");
  process.exit(1);
}

const SHIPPING_BUFFER = 1.5; // USD added to supplier price to cover shipping to LB

const PLAN = {
  women: ["women summer dress", "women blouse", "women handbag", "women jewelry set", "women watch"],
  men: ["men shirt", "men t-shirt cotton", "men watch", "men jacket", "men wallet"],
  shoes: ["men sneakers", "women sneakers", "women heels", "slippers"],
  tech: ["wireless earbuds", "phone case iphone", "smart watch", "power bank", "mechanical keyboard", "gaming mouse"],
  beauty: ["makeup brush set", "skin care serum", "lipstick set", "hair dryer"],
  home: ["kitchen organizer", "led lamp", "bed sheet set", "wall decor"],
  sport: ["yoga mat", "fitness resistance bands", "cycling gloves", "water bottle sport"],
  accessories: ["sunglasses", "baseball cap", "backpack", "belt"],
};

async function call(method, params) {
  const all = {
    app_key: KEY,
    method,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    ...params,
  };
  const base = Object.keys(all)
    .sort()
    .map((k) => k + all[k])
    .join("");
  all.sign = crypto.createHmac("sha256", SECRET).update(base).digest("hex").toUpperCase();
  const res = await fetch("https://api-sg.aliexpress.com/sync", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(all),
  });
  return res.json();
}

async function search(keywords, page) {
  const json = await call("aliexpress.affiliate.product.query", {
    keywords,
    page_no: String(page),
    page_size: "50",
    target_currency: "USD",
    target_language: "EN",
    ship_to_country: "LB",
    sort: "LAST_VOLUME_DESC",
    tracking_id: TRACKING,
  });
  const r = json?.aliexpress_affiliate_product_query_response?.resp_result;
  if (!r || r.resp_code !== 200) {
    console.warn(`  ! ${keywords} p${page}:`, JSON.stringify(json).slice(0, 300));
    return [];
  }
  return r.result?.products?.product ?? [];
}

function toProduct(p, department) {
  const cost = +(parseFloat(p.target_sale_price) + SHIPPING_BUFFER).toFixed(2);
  const original = parseFloat(p.target_original_price);
  const price = shelfPrice(cost);
  const images = [p.product_main_image_url, ...(p.product_small_image_urls?.string ?? [])].filter(Boolean);
  return {
    id: "ae" + p.product_id,
    title: cleanTitle(p.product_title),
    department,
    category: p.second_level_category_name || p.first_level_category_name || department,
    price,
    compareAt: original > parseFloat(p.target_sale_price) * 1.2 ? shelfPrice(original + SHIPPING_BUFFER) : undefined,
    cost,
    supplier: "aliexpress",
    supplierId: String(p.product_id),
    supplierUrl: p.product_detail_url,
    images: [...new Set(images)].slice(0, 6),
    rating: p.evaluate_rate ? +(parseFloat(String(p.evaluate_rate).replace("%", "")) / 20).toFixed(1) : undefined,
    reviews: p.lastest_volume ? Number(p.lastest_volume) : undefined,
    description: p.product_title,
    createdAt: new Date().toISOString(),
  };
}

// Quality gate: only items buyers actually liked, sold in volume, at a price
// where our markup still leaves the customer a good deal.
const QUALITY = {
  minPositive: 92, // % positive feedback (≈ 4.6 / 5)
  minSold: 100, // units sold recently — proof the item is real and ships
  minPrice: 1.5, // under this, quality is usually poor
  maxPrice: 150, // above this, customs + risk eat the margin
};
function passesQuality(p) {
  const rate = parseFloat(String(p.evaluate_rate ?? "0").replace("%", ""));
  const sold = Number(p.lastest_volume ?? 0);
  const price = parseFloat(p.target_sale_price);
  return rate >= QUALITY.minPositive && sold >= QUALITY.minSold && price >= QUALITY.minPrice && price <= QUALITY.maxPrice;
}

// AliExpress titles are keyword soup. Keep the first ~9 meaningful words.
function cleanTitle(t) {
  return t
    .replace(/\b(20\d\d|new|hot|sale|free shipping|dropshipping)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 9)
    .join(" ");
}

const [onlyDept, onlyKeyword, pagesArg] = process.argv.slice(2);
const plan = onlyDept ? { [onlyDept]: onlyKeyword ? [onlyKeyword] : PLAN[onlyDept] ?? [] } : PLAN;
const pages = Number(pagesArg) || 2;

const file = "data/products.json";
const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
const byId = new Map(existing.map((p) => [p.id, p]));
let added = 0;

for (const [dept, keywords] of Object.entries(plan)) {
  for (const kw of keywords) {
    for (let page = 1; page <= pages; page++) {
      const items = await search(kw, page);
      for (const raw of items) {
        if (!passesQuality(raw)) continue;
        const p = toProduct(raw, dept);
        if (!byId.has(p.id)) added++;
        byId.set(p.id, { ...byId.get(p.id), ...p, createdAt: byId.get(p.id)?.createdAt ?? p.createdAt });
      }
      console.log(`${dept} / ${kw} / page ${page}: ${items.length}`);
      if (items.length < 50) break;
    }
  }
}
fs.writeFileSync(file, JSON.stringify([...byId.values()], null, 2));
console.log(`Done. ${added} new, ${byId.size} total products.`);
