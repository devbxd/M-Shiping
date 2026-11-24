import fs from "node:fs";
import path from "node:path";
import { shippingEstimate } from "./pricing";

// Minimal CJ client for live price checks (server only).
const BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const TOKEN_FILE = path.join(process.cwd(), "data", ".cj-token.json");
let memo: { token: string; expires: number } | null = null;

async function token() {
  if (memo && memo.expires > Date.now() + 3600e3) return memo.token;
  try {
    const t = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
    if (t.key === process.env.CJ_API_KEY && Date.parse(t.expires) > Date.now() + 3600e3) {
      memo = { token: t.token, expires: Date.parse(t.expires) };
      return t.token as string;
    }
  } catch {}
  if (!process.env.CJ_API_KEY) throw new Error("CJ_API_KEY is not set");
  const res = await fetch(`${BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY }),
  });
  const json = await res.json();
  if (!json.result) throw new Error("CJ login failed: " + (json.message ?? "unknown"));
  memo = { token: json.data.accessToken, expires: Date.parse(json.data.accessTokenExpiryDate) };
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ key: process.env.CJ_API_KEY, token: memo.token, expires: json.data.accessTokenExpiryDate }));
  } catch {}
  return memo.token;
}

// Current supplier cost (product + shipping estimate), for the product and each variant.
export async function liveCost(pid: string, weight?: number) {
  const res = await fetch(`${BASE}/product/query?pid=${encodeURIComponent(pid)}`, {
    headers: { "CJ-Access-Token": await token() },
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.result) throw new Error(json.message ?? "CJ request failed");
  const d = json.data;
  const prices = String(d.sellPrice ?? "").split("--").map(parseFloat).filter((n) => n > 0);
  const base = Math.max(...prices);
  const vcosts: Record<string, number> = {};
  for (const v of d.variants ?? []) {
    const price = parseFloat(v.variantSellPrice);
    if (price > 0) vcosts[v.vid] = +(price + shippingEstimate(parseFloat(v.variantWeight) || weight)).toFixed(2);
  }
  return {
    cost: +(base + shippingEstimate(parseFloat(d.productWeight) || weight)).toFixed(2),
    vcosts,
    listed: Number(d.listedNum ?? 0),
  };
}
