import type { Product } from "@/lib/types";
import type { PricePoint } from "@/lib/pricing-store";
import { median, percentile, statsFor } from "@/lib/market";
import { shippingEstimate } from "@/lib/pricing";
import { money } from "@/lib/format";

const INK = "#121212";
const CLAY = "#c2562f";
const LINE = "#e6e2dc";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// Where the customer's money goes: supplier, shipping, you.
export function MoneySplit({ p }: { p: Product }) {
  const ship = Math.min(p.cost, +shippingEstimate((p as { weight?: number }).weight).toFixed(2));
  const supplier = +(p.cost - ship).toFixed(2);
  const profit = +(p.price - p.cost).toFixed(2);
  const pct = (v: number) => `${Math.max(2, (v / p.price) * 100)}%`;
  return (
    <div className="ins">
      <div className="split">
        <span style={{ width: pct(supplier), background: "#3f3f3f" }} />
        <span style={{ width: pct(ship), background: "#b8b2a9" }} />
        <span style={{ width: pct(profit), background: CLAY }} />
      </div>
      <div className="split-legend">
        <span><i style={{ background: "#3f3f3f" }} />Product {money(supplier)}</span>
        <span><i style={{ background: "#b8b2a9" }} />Shipping ≈{money(ship)}</span>
        <span><i style={{ background: CLAY }} /><b>You {money(profit)}</b></span>
      </div>
    </div>
  );
}

// How wanted it is: 5-step meter from the "shops selling it" number.
export function DemandMeter({ p }: { p: Product }) {
  const s = statsFor(p);
  const v = p.reviews ?? 0;
  const pct = percentile(s.demand, v);
  const level = pct >= 90 ? 5 : pct >= 70 ? 4 : pct >= 45 ? 3 : pct >= 20 ? 2 : 1;
  const words = ["", "Very low", "Low", "Medium", "High", "Very high"];
  return (
    <div className="ins">
      <div className="ins-head">
        <span>How many people want it</span>
        <b style={{ color: level >= 4 ? CLAY : INK }}>{words[level]}</b>
      </div>
      <div className="meter">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= level ? (level >= 4 ? "on hot" : "on") : ""} />
        ))}
      </div>
      <p className="ins-note">
        Sold by <b>{v.toLocaleString("en")}</b> shops worldwide · top {Math.max(1, 100 - pct)}% of the {s.count} {s.name.toLowerCase()} on your site
      </p>
    </div>
  );
}

// Your price compared with similar items on your site.
export function PriceCompare({ p }: { p: Product }) {
  const s = statsFor(p);
  const lo = s.prices[0], hi = s.prices.at(-1)!, med = median(s.prices);
  const w = 300;
  const X = (v: number) => (hi === lo ? w / 2 : 8 + ((v - lo) / (hi - lo)) * (w - 16));
  const pos = percentile(s.prices, p.price);
  const word = pos <= 25 ? "Cheaper than most" : pos >= 75 ? "More expensive than most" : "Normal price";
  return (
    <div className="ins">
      <div className="ins-head">
        <span>Your price vs similar items</span>
        <b style={{ color: pos >= 75 ? CLAY : INK }}>{word}</b>
      </div>
      <svg viewBox={`0 0 ${w} 30`} width="100%" height="30" aria-label="Price comparison">
        <line x1="8" x2={w - 8} y1="15" y2="15" stroke={LINE} strokeWidth="6" strokeLinecap="round" />
        <line x1={X(med)} x2={X(med)} y1="6" y2="24" stroke="#7a7671" strokeWidth="2" />
        <circle cx={X(p.price)} cy="15" r="8" fill={CLAY} stroke="#fff" strokeWidth="3" />
      </svg>
      <div className="ins-scale">
        <span>Cheapest<br /><b>{money(lo)}</b></span>
        <span style={{ textAlign: "center" }}>Most common<br /><b>{money(med)}</b></span>
        <span style={{ textAlign: "right" }}>Most expensive<br /><b>{money(hi)}</b></span>
      </div>
    </div>
  );
}

// Supplier price over time (filled by "Check supplier price now").
export function SupplierTrend({ p, history }: { p: Product; history?: PricePoint[] }) {
  if (!history?.length) {
    return (
      <div className="ins">
        <div className="ins-head">
          <span>Supplier price</span>
          <b className="muted">Never checked</b>
        </div>
        <p className="ins-note">Check it once in a while: if the supplier changes its price, your site price follows and your profit stays the same.</p>
      </div>
    );
  }
  const pts = history;
  const first = pts[0].cost, last = pts.at(-1)!.cost;
  const change = first ? ((last - first) / first) * 100 : 0;
  const w = 300, h = 56, pad = 6;
  const vals = pts.map((x) => x.cost);
  const min = Math.min(...vals) * 0.95, max = Math.max(...vals) * 1.05;
  const Y = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const X = (i: number) => (pts.length === 1 ? w / 2 : pad + (i / (pts.length - 1)) * (w - pad * 2));
  const d = pts.map((pt, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(pt.cost).toFixed(1)}`).join(" ");
  const word = Math.abs(change) < 1 ? "Stable" : change < 0 ? `Down ${Math.abs(change).toFixed(0)}%` : `Up ${change.toFixed(0)}%`;
  return (
    <div className="ins">
      <div className="ins-head">
        <span>Supplier price</span>
        <b style={{ color: change > 1 ? CLAY : change < -1 ? "#2f7a4f" : INK }}>{word}</b>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label="Supplier price history">
        <path d={d} fill="none" stroke={INK} strokeWidth="2" />
        {pts.map((pt, i) => (
          <circle key={i} cx={X(i)} cy={Y(pt.cost)} r={i === pts.length - 1 ? 4 : 2.5} fill={INK} />
        ))}
      </svg>
      <p className="ins-note">
        {money(first)} on {fmtDate(pts[0].at)} → <b>{money(last)}</b> on {fmtDate(pts.at(-1)!.at)} (product + shipping)
      </p>
    </div>
  );
}
