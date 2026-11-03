// Imports real products from CJdropshipping (API key is instant, no approval).
// 1. Sign up at https://cjdropshipping.com
// 2. My CJ → Authorization → API → Generate API Key
// 3. Put CJ_API_KEY=... in .env.local
// 4. npm run import:cj                          -> full keyword plan
//    npm run import:cj -- tech "earbuds" 2      -> one department, one keyword, 2 pages
import fs from "node:fs";
import { shelfPrice } from "./pricing.mjs";

for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const API_KEY = process.env.CJ_API_KEY;
if (!API_KEY) {
  console.error("Missing CJ_API_KEY in .env.local");
  process.exit(1);
}

const BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const SHIPPING_BUFFER = 4; // USD per item, China → Lebanon estimate. Adjust after first real orders.
const MIN_PRICE = 1;
const MAX_PRICE = 120;

const PLAN = {
  women: ["women dress", "women blouse", "women handbag", "women jewelry", "women watch", "women cardigan"],
  men: ["men shirt", "men t-shirt", "men watch", "men jacket", "men wallet", "men hoodie"],
  shoes: ["men sneakers", "women sneakers", "women heels", "sandals", "slippers"],
  tech: ["wireless earbuds", "phone case", "smart watch", "power bank", "keyboard", "gaming mouse", "bluetooth speaker"],
  beauty: ["makeup brush", "face serum", "lipstick", "hair straightener", "nail"],
  home: ["kitchen organizer", "led lamp", "bed sheet", "wall decor", "storage box"],
  sport: ["yoga mat", "resistance bands", "fitness", "sports bottle", "cycling"],
  accessories: ["sunglasses", "cap", "backpack", "belt", "scarf"],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// CJ allows one token request every 5 minutes; tokens last ~15 days, so cache it.
const TOKEN_FILE = "data/.cj-token.json";
async function token() {
  if (fs.existsSync(TOKEN_FILE)) {
    const t = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
    if (t.key === API_KEY && Date.parse(t.expires) > Date.now() + 3600e3) return t.token;
  }
  const res = await fetch(`${BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: API_KEY }),
  });
  const json = await res.json();
  if (!json.result) throw new Error("CJ auth failed: " + JSON.stringify(json));
  const t = {
    key: API_KEY,
    token: json.data.accessToken,
    expires: json.data.accessTokenExpiryDate ?? new Date(Date.now() + 14 * 864e5).toISOString(),
  };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(t));
  return t.token;
}

let last = 0;
async function get(tok, path, params) {
  const wait = 1100 - (Date.now() - last); // free tier: ~1 request / second
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, { headers: { "CJ-Access-Token": tok } });
  return res.json();
}

const firstPrice = (v) => parseFloat(String(v ?? "").split(/--|-|~/)[0]);

function cleanTitle(t) {
  return String(t)
    .replace(/\b(20\d\d|new|hot|sale|cross-border|european and american|foreign trade|amazon|ebay|wish)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 9)
    .join(" ");
}

function toProduct(p, department) {
  const supplierPrice = firstPrice(p.sellPrice);
  const cost = +(supplierPrice + SHIPPING_BUFFER).toFixed(2);
  return {
    id: "cj" + p.pid,
    title: cleanTitle(p.productNameEn),
    department,
    category: (p.categoryName || department).split(/[/>]/).pop().trim(),
    price: shelfPrice(cost),
    cost,
    supplier: "cj",
    supplierId: p.pid,
    supplierUrl: `https://cjdropshipping.com/product/-p-${p.pid}.html`,
    images: [p.productImage].filter(Boolean),
    description: cleanTitle(p.productNameEn),
    createdAt: new Date().toISOString(),
    _sku: p.productSku,
  };
}

const [onlyDept, onlyKeyword, pagesArg] = process.argv.slice(2);
const plan = onlyDept ? { [onlyDept]: onlyKeyword ? [onlyKeyword] : PLAN[onlyDept] ?? [] } : PLAN;
const pages = Number(pagesArg) || 1;

const tok = await token();
const file = "data/products.json";
const existing = (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : []).filter((p) => p.supplier !== "demo");
const byId = new Map(existing.map((p) => [p.id, p]));
let added = 0;

for (const [dept, keywords] of Object.entries(plan)) {
  for (const kw of keywords) {
    for (let page = 1; page <= pages; page++) {
      const json = await get(tok, "/product/list", { productNameEn: kw, pageNum: String(page), pageSize: "50" });
      if (!json.result) {
        console.warn(`  ! ${kw} p${page}:`, JSON.stringify(json).slice(0, 300));
        break;
      }
      const list = json.data?.list ?? [];
      let kept = 0;
      for (const raw of list) {
        const price = firstPrice(raw.sellPrice);
        if (!raw.productImage || !(price >= MIN_PRICE && price <= MAX_PRICE)) continue;
        const p = toProduct(raw, dept);
        if (!byId.has(p.id)) added++;
        byId.set(p.id, { ...p, createdAt: byId.get(p.id)?.createdAt ?? p.createdAt });
        kept++;
      }
      console.log(`${dept} / ${kw} / page ${page}: ${kept}/${list.length}`);
      if (list.length < 50) break;
    }
  }
}

if (byId.size === 0) {
  console.error("Nothing imported — catalog left unchanged.");
  process.exit(1);
}
fs.writeFileSync(file, JSON.stringify([...byId.values()], null, 2));
console.log(`Done. ${added} new, ${byId.size} total products.`);
