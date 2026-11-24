import Link from "next/link";
import { img } from "@/lib/img";
import { allProducts } from "@/lib/products";
import { DEPARTMENTS, departmentName } from "@/lib/config";
import { money } from "@/lib/format";
import { Pager } from "@/components/Pager";
import { DemandBar, PricePosition, PriceHistory } from "@/components/MarketCharts";
import { readPricing, ensurePricing } from "@/lib/pricing-store";
import { DEFAULT_MARGIN } from "@/lib/pricing";
import { demandRank } from "@/lib/market";
import { PriceControls } from "./controls";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; d?: string; sort?: string; page?: string }>;
const PER_PAGE = 24;

export default async function Catalog({ searchParams }: { searchParams: SP }) {
  await ensurePricing();
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
          return (
            <article className="pcard" key={p.id}>
              <div className="pcard-top">
                <div className="mini-thumb" style={{ width: 64, height: 64 }}>
                  <img src={img(p.images[0], 160)} alt="" loading="lazy" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/product/${p.id}`} target="_blank" className="pcard-title">
                    {p.title}
                  </Link>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {departmentName(p.department)} · {p.category} · #{demandRank(p.id)} overall
                  </div>
                </div>
              </div>
              <div className="pcard-nums">
                <div>
                  <span>Price</span>
                  <b>{money(p.price)}</b>
                </div>
                <div>
                  <span>Cost</span>
                  <b>{money(p.cost)}</b>
                </div>
                <div>
                  <span>Margin</span>
                  <b style={{ color: "var(--cedar-2)" }}>{money(p.price - p.cost)}</b>
                </div>
              </div>
              <PriceControls id={p.id} margin={margin} isCustom={e?.margin !== undefined} canLive={p.supplier === "cj"} />
              <DemandBar p={p} />
              <PricePosition p={p} />
              <PriceHistory p={p} history={e?.history} />
              {p.supplierUrl && (
                <a href={p.supplierUrl} target="_blank" rel="noreferrer" className="link-arrow" style={{ fontSize: 13 }}>
                  Open on {p.supplier.toUpperCase()}
                </a>
              )}
            </article>
          );
        })}
      </div>
      <Pager page={page} pages={pages} href={(n) => href({ page: n === 1 ? undefined : String(n) })} />
    </>
  );
}
