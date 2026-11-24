import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { updatePricing, readPricing, ensurePricing } from "@/lib/pricing-store";
import { liveCost } from "@/lib/cj";

// POST { margin: number | null }  -> set (or reset) this product's margin
// POST { live: true }             -> fetch the supplier's current price and record it
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensurePricing();
  const { id } = await params;
  const p = getProduct(id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));

  try {
    if (body.live) {
      if (p.supplier !== "cj" || !p.supplierId) return NextResponse.json({ error: "Live price only for CJ products" }, { status: 400 });
      const live = await liveCost(p.supplierId, (p as { weight?: number }).weight);
      const before = readPricing()[id]?.history?.length ? undefined : { at: new Date(Date.now() - 1000).toISOString(), cost: p.cost };
      updatePricing(id, (e) => ({
        ...e,
        history: [
          ...(e.history ?? []),
          ...(before ? [before] : []),
          {
            at: new Date().toISOString(),
            // for products sold by variant, track the cheapest variant (that's the "from" price shown)
            cost: p.variants?.length && Object.keys(live.vcosts).length ? Math.min(...Object.values(live.vcosts)) : live.cost,
            vcosts: live.vcosts,
          },
        ].slice(-60),
      }));
    } else if ("margin" in body) {
      const m = body.margin === null ? undefined : Number(body.margin);
      if (m !== undefined && !(m >= 0 && m <= 200)) return NextResponse.json({ error: "Margin must be between 0 and 200" }, { status: 400 });
      updatePricing(id, (e) => ({ ...e, margin: m }));
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  const after = getProduct(id)!;
  return NextResponse.json({ price: after.price, cost: after.cost });
}
