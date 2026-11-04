import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { money } from "@/lib/format";
import { DELIVERY } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order received" };

const FLOW = [
  ["pending", "Order received"],
  ["confirmed", "Confirmed with you by phone"],
  ["purchased", "Sourced from the supplier"],
  ["shipped", "On its way"],
  ["delivered", "Delivered"],
] as const;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const o = getOrder((await params).id);
  if (!o) notFound();
  const reached = FLOW.findIndex(([s]) => s === o.status);
  const first = o.customer.name.split(" ")[0];

  return (
    <div className="wrap">
      <div className="confirm">
        <span className="muted">Order {o.id}</span>
        <h1 className="display">
          {o.status === "cancelled" ? "This order was cancelled." : <>Thank you, {first}.</>}
        </h1>
        {o.status !== "cancelled" && (
          <p style={{ margin: 0, fontSize: 17, color: "var(--ink-2)", maxWidth: 560 }}>
            We&rsquo;ve received your order. Someone from our team will call or WhatsApp you on{" "}
            <b style={{ fontWeight: 500 }}>{o.customer.phone}</b> to confirm it. Expected delivery: {DELIVERY.estimate}{" "}
            after confirmation.
          </p>
        )}
        {o.status !== "cancelled" && (
          <div className="tracker">
            {FLOW.map(([s, label], i) => (
              <div key={s} className={i <= reached ? "done" : ""}>
                {label}
              </div>
            ))}
          </div>
        )}
        <div className="summary" style={{ position: "static" }}>
          {o.items.map((it) => (
            <div className="row" key={it.productId + (it.vid ?? "")}>
              <span>
                {it.qty} × {it.title}
                {it.variant && <> ({it.variant})</>}
              </span>
              <span>{money(it.price * it.qty)}</span>
            </div>
          ))}
          <div className="row">
            <span>Delivery</span>
            <span>{o.delivery ? money(o.delivery) : "Free"}</span>
          </div>
          <div className="row total">
            <span>To pay on delivery</span>
            <span>{money(o.total)}</span>
          </div>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          Keep this page&rsquo;s link to follow your order. <Link href="/shop" className="link-arrow">Continue shopping</Link>
        </p>
      </div>
    </div>
  );
}
