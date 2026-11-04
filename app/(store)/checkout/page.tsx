"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/Cart";
import { DELIVERY } from "@/lib/config";
import { money } from "@/lib/format";

const REGIONS = [
  "Beirut",
  "Mount Lebanon — Metn",
  "Mount Lebanon — Baabda",
  "Mount Lebanon — Keserwan / Jounieh",
  "Mount Lebanon — Chouf / Aley",
  "North — Tripoli",
  "North — Batroun / Byblos",
  "South — Saida",
  "South — Tyre",
  "Nabatieh",
  "Bekaa — Zahle",
  "Baalbek-Hermel",
  "Akkar",
];

export default function Checkout() {
  const { lines, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const delivery = subtotal >= DELIVERY.freeAbove ? 0 : DELIVERY.fee;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: f.get("name"),
            phone: f.get("phone"),
            email: f.get("email"),
            city: f.get("city"),
            address: f.get("address"),
            notes: f.get("notes"),
          },
          payment: f.get("payment"),
          items: lines.map((l) => ({ productId: l.productId, vid: l.vid, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      clear();
      router.push(`/order/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (ready && lines.length === 0) {
    return (
      <div className="wrap">
        <div className="page-title">
          <h1 className="display">Checkout</h1>
        </div>
        <p className="empty" style={{ textAlign: "left", paddingTop: 0 }}>
          Your bag is empty. <Link href="/shop" className="link-arrow">Browse the shop</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="page-title">
        
        <h1 className="display">Checkout</h1>
      </div>
      <form className="two-col" onSubmit={submit}>
        <div className="form">
          <h2 className="form-title">Delivery details</h2>
          <div className="pair">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone (WhatsApp)</label>
              <input id="phone" name="phone" required inputMode="tel" placeholder="+961 70 123 456" autoComplete="tel" />
            </div>
          </div>
          <div className="pair">
            <div className="field">
              <label htmlFor="city">Region</label>
              <select id="city" name="city" required defaultValue="">
                <option value="" disabled>
                  Choose
                </option>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="email">Email (optional)</label>
              <input id="email" name="email" type="email" autoComplete="email" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="address">Address — town, street, building, floor</label>
            <textarea id="address" name="address" required />
          </div>
          <div className="field">
            <label htmlFor="notes">Note (size, colour, anything)</label>
            <textarea id="notes" name="notes" />
          </div>

          <h2 className="form-title" style={{ marginTop: 12 }}>Payment</h2>
          <div className="choice">
            <label>
              <input type="radio" name="payment" value="cod" defaultChecked />
              <span>
                Cash on delivery
                <small>Pay the courier in USD when your order arrives.</small>
              </span>
            </label>
            <label>
              <input type="radio" name="payment" value="whish" />
              <span>
                Whish Money
                <small>We send you the Whish details when we call to confirm.</small>
              </span>
            </label>
          </div>
        </div>

        <aside className="summary">
          {lines.map((l) => (
            <div className="row" key={l.key}>
              <span style={{ maxWidth: 230 }}>
                {l.qty} × {l.title}
                {l.variant && <> ({l.variant})</>}
              </span>
              <span>{money(l.price * l.qty)}</span>
            </div>
          ))}
          <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <span>Delivery</span>
            <span>{delivery ? money(delivery) : "Free"}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <span>{money(subtotal + delivery)}</span>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn block" disabled={busy || !ready}>
            {busy ? "Sending…" : "Place order"}
          </button>
          <small>
            Your order is reviewed by our team before anything is bought. We&rsquo;ll call or WhatsApp you to
            confirm within 24 hours.
          </small>
        </aside>
      </form>
    </div>
  );
}
