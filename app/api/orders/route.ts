import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { createOrder, newOrderId } from "@/lib/orders";
import { DELIVERY } from "@/lib/config";
import type { Order, OrderItem } from "@/lib/types";

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const c = body?.customer ?? {};
  const customer = {
    name: str(c.name, 120),
    phone: str(c.phone, 40),
    email: str(c.email, 160) || undefined,
    city: str(c.city, 80),
    address: str(c.address, 500),
    notes: str(c.notes, 500) || undefined,
  };
  if (!customer.name || !customer.address || !customer.city) {
    return NextResponse.json({ error: "Please fill in your name, region and address." }, { status: 400 });
  }
  if (customer.phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  // Prices always come from our catalog, never from the browser.
  const items: OrderItem[] = [];
  for (const raw of Array.isArray(body.items) ? body.items.slice(0, 50) : []) {
    const p = getProduct(String(raw.productId));
    const qty = Math.max(1, Math.min(10, Math.floor(Number(raw.qty) || 1)));
    if (!p) continue;
    items.push({
      productId: p.id,
      title: p.title,
      image: p.images[0],
      price: p.price,
      cost: p.cost,
      qty,
      supplier: p.supplier,
      supplierUrl: p.supplierUrl,
    });
  }
  if (!items.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

  const subtotal = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
  const delivery = subtotal >= DELIVERY.freeAbove ? 0 : DELIVERY.fee;
  const now = new Date().toISOString();
  const order: Order = {
    id: newOrderId(),
    createdAt: now,
    updatedAt: now,
    status: "pending",
    customer,
    payment: body.payment === "whish" ? "whish" : "cod",
    items,
    subtotal,
    delivery,
    total: +(subtotal + delivery).toFixed(2),
    history: [{ at: now, status: "pending" }],
  };
  createOrder(order);
  return NextResponse.json({ id: order.id });
}
