import fs from "node:fs";
import path from "node:path";

// Tiny JSON key/value store.
// - Online (Vercel): Upstash Redis over its REST API, when KV_REST_API_URL / KV_REST_API_TOKEN
//   (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) are set.
// - Locally: a JSON file per key in data/.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const kvOnline = !!(URL_ && TOKEN);

async function redis(cmd: (string | number)[]) {
  const res = await fetch(URL_!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.error) throw new Error("Database error: " + json.error);
  return json.result;
}

const fileOf = (key: string) => path.join(process.cwd(), "data", `${key}.json`);

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  if (kvOnline) {
    const raw = await redis(["GET", `ms:${key}`]);
    return raw ? (JSON.parse(raw) as T) : fallback;
  }
  const f = fileOf(key);
  return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as T) : fallback;
}

export async function kvSet<T>(key: string, value: T) {
  if (kvOnline) {
    await redis(["SET", `ms:${key}`, JSON.stringify(value)]);
    return;
  }
  const f = fileOf(key);
  try {
    fs.writeFileSync(f + ".tmp", JSON.stringify(value, null, key === "orders" ? 2 : 0));
    fs.renameSync(f + ".tmp", f);
  } catch {
    throw new Error("No database connected: this host cannot save data. Connect Upstash Redis in Vercel → Storage.");
  }
}
