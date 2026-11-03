import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Order, OrderStatus } from "./types";

// Local JSON store — fine for launch volume. Swap for Supabase/Postgres later
// without touching the pages: only these functions read/write orders.
// On Vercel the project folder is read-only: only /tmp is writable, and it is
// wiped regularly. Good enough to test; use a real database for production.
const FILE = process.env.VERCEL
  ? path.join("/tmp", "orders.json")
  : path.join(process.cwd(), "data", "orders.json");

function read(): Order[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function write(orders: Order[]) {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(orders, null, 2));
  fs.renameSync(tmp, FILE);
}

export function listOrders(status?: OrderStatus | "all") {
  const all = read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return status && status !== "all" ? all.filter((o) => o.status === status) : all;
}

export function getOrder(id: string) {
  return read().find((o) => o.id === id);
}

export function newOrderId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `MS-${ymd}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

export function createOrder(order: Order) {
  const all = read();
  all.push(order);
  write(all);
  return order;
}

export function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "supplierOrderRef" | "tracking" | "adminNote">>,
  note?: string,
) {
  const all = read();
  const o = all.find((x) => x.id === id);
  if (!o) return null;
  const now = new Date().toISOString();
  if (patch.status && patch.status !== o.status) {
    o.history.push({ at: now, status: patch.status, note });
  }
  Object.assign(o, patch, { updatedAt: now });
  write(all);
  return o;
}
