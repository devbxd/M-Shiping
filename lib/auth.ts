// Works in both the edge middleware and Node route handlers (Web Crypto only).
export const ADMIN_COOKIE = "ms_admin";

export async function adminToken() {
  const secret = process.env.SESSION_SECRET ?? "dev-secret";
  const pass = process.env.ADMIN_PASSWORD ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("admin:" + pass));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isAdminCookie(value: string | undefined) {
  if (!value || !process.env.ADMIN_PASSWORD) return false;
  return value === (await adminToken());
}
