import crypto from "node:crypto";
import { kvGet, kvSet } from "./kv";
import type { Order, OrderStatus } from "./types";

// Orders live under the "orders" key: Upstash Redis online, data/orders.json locally.
const read = () => kvGet<Order[]>("orders", []);
const write = (orders: Order[]) => kvSet("orders", orders);

export async function listOrders(status?: OrderStatus | "all") {
  const all = (await read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return status && status !== "all" ? all.filter((o) => o.status === status) : all;
}

export async function getOrder(id: string) {
  return (await read()).find((o) => o.id === id);
}

export function newOrderId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `MS-${ymd}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

export async function createOrder(order: Order) {
  const all = await read();
  all.push(order);
  await write(all);
  return order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "supplierOrderRef" | "tracking" | "adminNote">>,
  note?: string,
) {
  const all = await read();
  const o = all.find((x) => x.id === id);
  if (!o) return null;
  const now = new Date().toISOString();
  if (patch.status && patch.status !== o.status) o.history.push({ at: now, status: patch.status, note });
  Object.assign(o, patch, { updatedAt: now });
  await write(all);
  return o;
}
