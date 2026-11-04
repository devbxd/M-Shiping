"use client";
import { img } from "@/lib/img";
import Link from "next/link";
import { useCart } from "@/components/Cart";
import { DELIVERY } from "@/lib/config";
import { money } from "@/lib/format";

export default function Bag() {
  const { lines, subtotal, setQty, remove, ready } = useCart();
  const delivery = subtotal >= DELIVERY.freeAbove || subtotal === 0 ? 0 : DELIVERY.fee;

  return (
    <div className="wrap">
      <div className="page-title">
        <h1 className="display">Bag</h1>
      </div>
      {ready && lines.length === 0 ? (
        <div className="empty" style={{ textAlign: "left", paddingTop: 0 }}>
          <p className="h2" style={{ color: "var(--ink)" }}>
            Your bag is empty.
          </p>
          <p>
            <Link href="/shop" className="link-arrow">
              Browse the shop
            </Link>
          </p>
        </div>
      ) : (
        <div className="two-col">
          <div>
            {lines.map((l) => (
              <div className="line" key={l.id}>
                <Link href={`/product/${l.id}`} className="thumb">
                  <img src={img(l.image, 240)} alt="" />
                </Link>
                <div className="meta">
                  <Link href={`/product/${l.id}`}>{l.title}</Link>
                  <span className="num muted">{money(l.price)}</span>
                  <div className="controls">
                    <div className="qty">
                      <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="Less">
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button onClick={() => setQty(l.id, l.qty + 1)} aria-label="More">
                        +
                      </button>
                    </div>
                    <button className="text-btn" onClick={() => remove(l.id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <span className="num">{money(l.price * l.qty)}</span>
              </div>
            ))}
          </div>
          <aside className="summary">
            <div className="row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="row">
              <span>Delivery</span>
              <span>{delivery ? money(delivery) : "Free"}</span>
            </div>
            <div className="row total">
              <span>Total</span>
              <span>{money(subtotal + delivery)}</span>
            </div>
            {delivery > 0 && (
              <small>Add {money(DELIVERY.freeAbove - subtotal)} more for free delivery.</small>
            )}
            <Link href="/checkout" className="btn block">
              Checkout
            </Link>
            <small>Nothing is charged now. We call you to confirm, you pay at the door.</small>
          </aside>
        </div>
      )}
    </div>
  );
}
