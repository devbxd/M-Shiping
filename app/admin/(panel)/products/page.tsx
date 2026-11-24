import Link from "next/link";
import { img } from "@/lib/img";
import { allProducts } from "@/lib/products";
import { DEPARTMENTS, departmentName } from "@/lib/config";
import { money } from "@/lib/format";
import { Pager } from "@/components/Pager";
import { MoneySplit, DemandMeter, PriceCompare, SupplierTrend } from "@/components/MarketCharts";
import { readPricing, ensurePricing } from "@/lib/pricing-store";
import { DEFAULT_MARGIN } from "@/lib/pricing";
import { advice, demandRank } from "@/lib/market";
import { MarginEditor, LiveCheck } from "./controls";
import "./pricing.css";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; d?: string; sort?: string; page?: string }>;
const PER_PAGE = 18;

export default async function Catalog({ searchParams }: { searchParams: SP }) {
  await ensurePricing(true); // always fresh here: another server may have just saved a change
  const sp = await searchParams;
  const pricing = readPricing();
  let list = allProducts();
  if (sp.d) list = list.filter((p) => p.department === sp.d);
  if (sp.q) {
    const terms = sp.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((p) => terms.every((t) => `${p.title} ${p.category}`.toLowerCase().includes(t)));
  }
  const sort = sp.sort ?? "demand";
  const sorters: Record<string, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
    demand: (a, b) => (b.reviews ?? 0) - (a.reviews ?? 0),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    margin: (a, b) => b.price - b.cost - (a.price - a.cost),
    custom: (a, b) => Number(!!pricing[b.id]) - Number(!!pricing[a.id]),
  };
  list = [...list].sort(sorters[sort] ?? sorters.demand);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const items = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const customised = Object.values(pricing).filter((e) => e.margin !== undefined).length;

  const href = (patch: Record<string, string | undefined>) => {
    const next = { q: sp.q, d: sp.d, sort: sp.sort, ...patch };
    const s = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return "/admin/products" + (s ? "?" + s : "");
  };

  return (
    <>
      <div className="admin-title">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Products &amp; prices</h1>
        </div>
        <form className="search" style={{ minWidth: 260 }}>
          {sp.d && <input type="hidden" name="d" value={sp.d} />}
          <input name="q" defaultValue={sp.q} placeholder="Search products" />
        </form>
      </div>

      <div className="kpis">
        <div>
          <span className="eyebrow">Products</span>
          <b className="num">{list.length.toLocaleString("en")}</b>
        </div>
        <div>
          <span className="eyebrow">Default margin</span>
          <b className="num">{money(DEFAULT_MARGIN)}</b>
        </div>
        <div>
          <span className="eyebrow">Custom margins</span>
          <b className="num">{customised}</b>
        </div>
        <div>
          <span className="eyebrow">Avg. price shown</span>
          <b className="num">{money(list.reduce((s, p) => s + p.price, 0) / (list.length || 1))}</b>
        </div>
      </div>

      <div className="guide">
        <div>
          <b>Your profit</b>
          <p>What you keep on each sale, after paying the product and its shipping. Change it with − / +, the site price updates right away.</p>
        </div>
        <div>
          <b>How many people want it</b>
          <p>How many online shops worldwide already sell this item. More shops = proven demand.</p>
        </div>
        <div>
          <b>Price vs similar items</b>
          <p>Your price (orange dot) next to the other items of the same kind on your site.</p>
        </div>
        <div>
          <b>Advice</b>
          <p>A simple suggestion based on demand and price. Green = push it, orange = price looks high.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div className="tabs">
            <Link href={href({ d: undefined, page: undefined })} className={!sp.d ? "on" : ""}>
              All
            </Link>
            {DEPARTMENTS.map((d) => (
              <Link key={d.slug} href={href({ d: d.slug, page: undefined })} className={sp.d === d.slug ? "on" : ""}>
                {d.name}
              </Link>
            ))}
          </div>
          <div className="tabs">
            {[
              ["demand", "Most demanded"],
              ["margin", "Best margin"],
              ["price-asc", "Cheapest"],
              ["price-desc", "Most expensive"],
              ["custom", "Edited first"],
            ].map(([k, label]) => (
              <Link key={k} href={href({ sort: k === "demand" ? undefined : k, page: undefined })} className={sort === k ? "on" : ""}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="pgrid">
        {items.map((p) => {
          const e = pricing[p.id];
          const margin = e?.margin ?? DEFAULT_MARGIN;
          const tip = advice(p);
          return (
            <article className="pcard" key={p.id}>
              <div className="pcard-top">
                <a href={"/product/" + p.id} target="_blank" className="pcard-img">
                  <img src={img(p.images[0], 240)} alt="" loading="lazy" />
                </a>
                <div style={{ minWidth: 0 }}>
                  <a href={"/product/" + p.id} target="_blank" className="pcard-title">
                    {p.title}
                  </a>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {departmentName(p.department)} · {p.category}
                  </div>
                  <div className="pcard-rank">#{demandRank(p.id)} best seller of your shop</div>
                </div>
              </div>

              <div className="pcard-sum">
                <div>
                  <span>Customer pays</span>
                  <b>{money(p.price)}</b>
                </div>
                <div className="arrow" aria-hidden>
                  →
                </div>
                <div>
                  <span>You earn</span>
                  <b className="earn">{money(p.price - p.cost)}</b>
                </div>
              </div>
              <MoneySplit p={p} />

              <div className={"advice " + tip.tone}>
                <b>{tip.title}</b>
                <span>{tip.text}</span>
              </div>

              <MarginEditor id={p.id} cost={p.cost} margin={margin} isCustom={e?.margin !== undefined} />

              <div className="pcard-section">
                <DemandMeter p={p} />
                <PriceCompare p={p} />
                <SupplierTrend p={p} history={e?.history} />
              </div>

              <div className="pcard-foot">
                {p.supplier === "cj" && <LiveCheck id={p.id} />}
                {p.supplierUrl && (
                  <a href={p.supplierUrl} target="_blank" rel="noreferrer" className="link-arrow" style={{ fontSize: 13 }}>
                    See it on CJ
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <Pager page={page} pages={pages} href={(n) => href({ page: n === 1 ? undefined : String(n) })} />
    </>
  );
}
