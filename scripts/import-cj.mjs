// Imports real products from CJdropshipping by category, best sellers first.
// Setup: CJ_API_KEY=... in .env.local (My CJ → Authorization → API).
//   npm run import:cj               -> whole plan below
//   npm run import:cj -- tech 2     -> one department, 2 pages per category
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

// ---- rules -------------------------------------------------------------
const RULES = {
  minListed: 50, // at least 50 stores already sell it = proven product
  minPrice: 1, // supplier price, USD
  maxPrice: 80,
  maxSpread: 3, // skip items whose variants range from $1 to $30 (price would be misleading)
  maxWeight: 2000, // grams — heavier items cost too much to ship to Lebanon
};
// China → Lebanon shipping estimate by weight (CJPacket-like). Tune after real orders.
const shipping = (grams) => 2.5 + (grams || 300) * 0.012;

// Department → CJ category names (third level of CJ's tree).
const PLAN = {
  women: [
    "Women's Short-Sleeved Shirts", "Women's Long-Sleeved Shirts", "Women's Camis", "Women's Skirts", "Leggings",
    "Woman Jeans", "Women's Coats", "Blazers", "Cocktail Dresses", "Evening Dresses", "Women's Sweater Dresses",
    "Women's Cardigans", "Shoulder Bags", "Women's Crossbody Bags", "Totes", "Necklace & Pendants",
    "Bracelets & Bangles", "Rings", "Women's Bracelet Watches",
  ],
  men: [
    "Men's Shirts", "Solid", "Print", "Man Hoodies & Sweatshirts", "Men's Jackets", "Man Jeans", "Casual Pants",
    "Man Shorts", "Sweatpants", "Quartz Watches", "Mechanical Watches", "Man Wallets", "Men's Backpacks", "Crossbody Bags",
  ],
  shoes: [
    "Running Shoes", "Casual Shoes", "Vulcanize Shoes", "Woman Sandals", "Pumps", "Flats", "Woman Boots", "Man Boots",
    "Man Slippers", "Woman Slippers", "Basketball Shoes",
  ],
  tech: [
    "Earphones & Headphones", "Speakers", "Smart Watches", "Smart Wristbands", "Power Bank", "Chargers",
    "Holders & Stands", "Patterned Cases", "Wallet Cases", "Gamepads", "Action Cameras", "Projectors",
    "Home Electronic Accessories", "Microphones",
  ],
  beauty: [
    "Makeup Brushes", "Lipstick", "Eyeshadow", "Makeup Set", "False Eyelashes", "Facial Care", "Body Care",
    "Face Skin Care Tools", "Straightening Irons", "Curling Iron", "Nail Art Kits", "Mirrors", "Personal Care Appliances",
  ],
  home: [
    "Bedding Sets", "Cushion Covers", "Curtains", "Towels", "Drinkware", "Cooking Tools", "Kitchen Storage",
    "Decor Paintings", "Night Lights", "Wall Lamps", "String Lights", "Kitchen Appliances", "Cleaning Appliances",
    "Storage Bags & Cases & Boxes",
  ],
  sport: [
    "Fitness & Bodybuilding", "Camping & Hiking", "Sports Bags", "Cycling Gloves", "Bicycle Lights",
    "Swimming Goggles", "Bikini Sets", "Jerseys", "Outdoor Shorts",
  ],
  kids: [
    "Boy T-Shirts", "Boy Clothing Sets", "Girl Dresses", "Girl Clothing Sets", "Baby Rompers", "Baby Clothing Sets",
    "Stuffed & Plush Animals", "Blocks", "Children's Shoes", "School Bags",
  ],
  accessories: [
    "Eyewear & Accessories", "Baseball Caps", "Scarves & Wraps", "Fashion Backpacks", "Woman Wallets", "Keychains",
    "Woman Hats & Caps", "Skullies & Beanies", "Belts & Cummerbunds",
  ],
};

// ---- API ---------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  const t = { key: API_KEY, token: json.data.accessToken, expires: json.data.accessTokenExpiryDate };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(t));
  return t.token;
}

let last = 0;
async function get(tok, path, params = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait = 1150 - (Date.now() - last); // free tier ≈ 1 request / second
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const res = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, { headers: { "CJ-Access-Token": tok } });
    const json = await res.json().catch(() => null);
    if (json?.result) return json;
    if (json?.code === 1600200 || res.status === 429) {
      await sleep(3000); // rate limited — back off and retry
      continue;
    }
    return json;
  }
  return null;
}

// ---- mapping -----------------------------------------------------------
const prices = (v) => String(v ?? "").split("--").map((s) => parseFloat(s)).filter((n) => n > 0);

function cleanTitle(t) {
  let s = String(t)
    .replace(/\b(20\d\d|new|hot|sale|cross-border|european and american|foreign trade|amazon|ebay|wish|tiktok)\b/gi, "")
    .replace(/[^\p{L}\p{N}&'’\-+/., ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 10)
    .join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fromRemark(html) {
  html = String(html ?? "");
  const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]).filter((u) => /^https:/.test(u));
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return { images, text: text.slice(0, 900) };
}

function toProduct(p, department, catName) {
  const ps = prices(p.sellPrice);
  const top = Math.max(...ps);
  const weight = parseFloat(p.productWeight) || 0;
  const cost = +(top + shipping(weight)).toFixed(2);
  const { images, text } = fromRemark(p.remark);
  return {
    id: "cj" + p.pid,
    title: cleanTitle(p.productNameEn),
    department,
    category: catName.replace(/^(Woman|Women's|Man|Men's|Boy|Girl|Baby)\s+/i, "").replace(/^./, (c) => c.toUpperCase()),
    price: shelfPrice(cost),
    cost,
    supplier: "cj",
    supplierId: p.pid,
    supplierSku: p.productSku,
    supplierUrl: `https://cjdropshipping.com/product/-p-${p.pid}.html`,
    images: [p.productImage], // remark images are often supplier screenshots; real gallery comes from enrich-cj
    reviews: p.listedNum,
    description: text || cleanTitle(p.productNameEn),
    weight,
    createdAt: new Date(p.createTime || Date.now()).toISOString(),
  };
}

function passes(p) {
  const ps = prices(p.sellPrice);
  if (!ps.length || !p.productImage) return false;
  const lo = Math.min(...ps), hi = Math.max(...ps);
  const w = parseFloat(p.productWeight) || 0;
  return (
    (p.listedNum ?? 0) >= RULES.minListed &&
    lo >= RULES.minPrice && hi <= RULES.maxPrice &&
    hi / lo <= RULES.maxSpread &&
    w <= RULES.maxWeight
  );
}

// ---- run ---------------------------------------------------------------
const [onlyDept, pagesArg] = process.argv.slice(2);
const plan = onlyDept ? { [onlyDept]: PLAN[onlyDept] ?? [] } : PLAN;
const pages = Number(pagesArg) || 1;

const tok = await token();
const tree = (await get(tok, "/product/getCategory"))?.data ?? [];
const catIds = new Map();
for (const a of tree)
  for (const b of a.categoryFirstList ?? [])
    for (const c of b.categorySecondList ?? []) if (!catIds.has(c.categoryName)) catIds.set(c.categoryName, c.categoryId);

const file = "data/products.json";
const existing = (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : []).filter((p) => p.supplier !== "demo");
const byId = new Map(existing.map((p) => [p.id, p]));
let added = 0;

for (const [dept, cats] of Object.entries(plan)) {
  for (const name of cats) {
    const categoryId = catIds.get(name);
    if (!categoryId) {
      console.warn(`  ? category not found: ${name}`);
      continue;
    }
    for (let page = 1; page <= pages; page++) {
      const json = await get(tok, "/product/list", {
        categoryId, pageNum: String(page), pageSize: "50", orderBy: "listedNum", sort: "desc",
      });
      if (!json?.result) {
        console.warn(`  ! ${name} p${page}:`, JSON.stringify(json).slice(0, 200));
        break;
      }
      const list = json.data?.list ?? [];
      let kept = 0;
      for (const raw of list) {
        if (!passes(raw)) continue;
        const p = toProduct(raw, dept, name);
        if (!byId.has(p.id)) added++;
        byId.set(p.id, p);
        kept++;
      }
      console.log(`${dept.padEnd(11)} ${name.padEnd(30)} p${page}: kept ${kept}/${list.length}`);
      if (list.length < 50) break;
    }
  }
}

if (byId.size === 0) {
  console.error("Nothing imported — catalog left unchanged.");
  process.exit(1);
}
fs.writeFileSync(file, JSON.stringify([...byId.values()]));
console.log(`Done. ${added} new, ${byId.size} total products.`);
