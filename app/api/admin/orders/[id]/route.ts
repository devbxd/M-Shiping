import { NextResponse } from "next/server";
import { updateOrder } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "purchased", "shipped", "delivered", "cancelled"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const patch: Parameters<typeof updateOrder>[1] = {};
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return NextResponse.json({ error: "bad status" }, { status: 400 });
    patch.status = b.status;
  }
  for (const k of ["supplierOrderRef", "tracking", "adminNote"] as const) {
    if (typeof b[k] === "string") patch[k] = b[k].slice(0, 1000);
  }
  const o = updateOrder(id, patch, typeof b.note === "string" ? b.note.slice(0, 300) : undefined);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(o);
}
