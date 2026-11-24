import type { Product } from "@/lib/types";
import type { PricePoint } from "@/lib/pricing-store";
import { median, percentile, statsFor } from "@/lib/market";
import { money } from "@/lib/format";

const INK = "#121212";
const CLAY = "#c2562f";
const LINE = "#e6e2dc";

// 1) Demand: where this product sits among its category
export function DemandBar({ p }: { p: Product }) {
  const s = statsFor(p);
  const v = p.reviews ?? 0;
  const pct = percentile(s.demand, v);
  const w = 260;
  const x = s.maxDemand ? (v / s.maxDemand) * w : 0;
  const med = s.maxDemand ? (median(s.demand) / s.maxDemand) * w : 0;
  const label = pct >= 90 ? "Best seller" : pct >= 60 ? "Strong" : pct >= 30 ? "Average" : "Weak";
  return (
    <div className="mc">
      <div className="mc-head">
        <span>Market demand</span>
        <b style={{ color: pct >= 60 ? CLAY : INK }}>{label}</b>
      </div>
      <svg viewBox={`0 0 ${w} 22`} width="100%" height="22" aria-label={`Demand ${v} stores`}>
        <rect x="0" y="6" width={w} height="10" rx="5" fill={LINE} />
        <rect x="0" y="6" width={Math.max(3, x)} height="10" rx="5" fill={pct >= 60 ? CLAY : INK} />
        <line x1={med} x2={med} y1="2" y2="20" stroke="#7a7671" strokeWidth="1.5" />
      </svg>
      <div className="mc-foot">
        <span>{v.toLocaleString("en")} stores sell it</span>
        <span>
          top {Math.max(1, 100 - pct)}% of {s.count} in {s.name}
        </span>
      </div>
    </div>
  );
}

// 2) Price position: our price vs. the category range
export function PricePosition({ p }: { p: Product }) {
  const s = statsFor(p);
  const lo = s.prices[0], hi = s.prices.at(-1)!, med = median(s.prices);
  const w = 260;
  const X = (v: number) => (hi === lo ? w / 2 : 6 + ((v - lo) / (hi - lo)) * (w - 12));
  const q1 = s.prices[Math.floor(s.prices.length * 0.25)], q3 = s.prices[Math.floor(s.prices.length * 0.75)];
  const pos = percentile(s.prices, p.price);
  const label = pos <= 25 ? "Cheap for its category" : pos >= 75 ? "Expensive for its category" : "Fair price";
  return (
    <div className="mc">
      <div className="mc-head">
        <span>Price vs. market</span>
        <b style={{ color: pos >= 75 ? CLAY : INK }}>{label}</b>
      </div>
      <svg viewBox={`0 0 ${w} 26`} width="100%" height="26" aria-label="Price position">
        <line x1="6" x2={w - 6} y1="13" y2="13" stroke={LINE} strokeWidth="2" />
        <rect x={X(q1)} y="7" width={Math.max(2, X(q3) - X(q1))} height="12" rx="3" fill="#ece8e2" />
        <line x1={X(med)} x2={X(med)} y1="5" y2="21" stroke="#7a7671" strokeWidth="1.5" />
        <circle cx={X(p.price)} cy="13" r="6" fill={CLAY} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="mc-foot">
        <span>{money(lo)}</span>
        <span>median {money(med)}</span>
        <span>{money(hi)}</span>
      </div>
    </div>
  );
}

// 3) Supplier price over time + our price
export function PriceHistory({ p, history }: { p: Product; history?: PricePoint[] }) {
  const pts = history?.length ? history : [{ at: p.createdAt, cost: p.cost }];
  const w = 260, h = 64, pad = 6;
  const vals = [...pts.map((x) => x.cost), p.price];
  const min = Math.min(...vals) * 0.9, max = Math.max(...vals) * 1.05;
  const Y = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const X = (i: number) => (pts.length === 1 ? w - pad : pad + (i / (pts.length - 1)) * (w - pad * 2));
  const path = pts.map((pt, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(pt.cost).toFixed(1)}`).join(" ");
  const first = pts[0].cost, last = pts.at(-1)!.cost;
  const change = first ? ((last - first) / first) * 100 : 0;
  return (
    <div className="mc">
      <div className="mc-head">
        <span>Supplier price (live)</span>
        <b style={{ color: change > 1 ? CLAY : change < -1 ? "#2f7a4f" : INK }}>
          {pts.length > 1 ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%` : "—"}
        </b>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label="Price history">
        <line x1="0" x2={w} y1={Y(p.price)} y2={Y(p.price)} stroke={CLAY} strokeDasharray="4 3" />
        <text x={w - 2} y={Y(p.price) - 4} textAnchor="end" fontSize="9" fill={CLAY}>
          your price {money(p.price)}
        </text>
        {pts.length > 1 && <path d={path} fill="none" stroke={INK} strokeWidth="2" />}
        {pts.map((pt, i) => (
          <circle key={i} cx={X(i)} cy={Y(pt.cost)} r={i === pts.length - 1 ? 3.5 : 2} fill={INK} />
        ))}
      </svg>
      <div className="mc-foot">
        <span>cost {money(last)}</span>
        <span>{history?.length ? "checked " + new Date(pts.at(-1)!.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "not checked live yet"}</span>
      </div>
    </div>
  );
}
