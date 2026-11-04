import Link from "next/link";
import { DEPARTMENTS, departmentName } from "@/lib/config";
import { categoriesOf, queryProducts, type Sort } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "./sort";
import { Pager } from "@/components/Pager";
import { AdStrip } from "@/components/Ads";
import { Fragment } from "react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop" };

type SP = Promise<Record<string, string | undefined>>;

export default async function Shop({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const d = sp.d;
  const c = sp.c;
  const q = sp.q?.trim();
  const sort = (sp.sort as Sort) || "new";
  const page = Number(sp.page) || 1;
  const res = queryProducts({ department: d, category: c, q, sort, page });
  const cats = d ? categoriesOf(d) : [];

  const href = (patch: Record<string, string | undefined>) => {
    const next = { d, c, q, sort: sort === "new" ? undefined : sort, ...patch };
    const s = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return "/shop" + (s ? "?" + s : "");
  };

  const title = q ? `Results for “${q}”` : d ? departmentName(d) : "All products";

  return (
    <div className="wrap shop">
      <div className="shop-head">
        <h1 className="display">{title}</h1>
        <span className="muted">{res.total} products</span>
      </div>

      <form className="shop-search" action="/shop" role="search" id="search">
        <input name="q" type="search" placeholder="Search products" defaultValue={q} aria-label="Search" />
        {d && <input type="hidden" name="d" value={d} />}
      </form>

      <nav className="chips" aria-label="Departments">
        <Link href={href({ d: undefined, c: undefined, page: undefined })} className={!d ? "on" : ""}>
          All
        </Link>
        {DEPARTMENTS.map((x) => (
          <Link key={x.slug} href={href({ d: x.slug, c: undefined, page: undefined })} className={d === x.slug ? "on" : ""}>
            {x.name}
          </Link>
        ))}
      </nav>
      {cats.length > 1 && (
        <nav className="chips sub" aria-label="Categories">
          <Link href={href({ c: undefined, page: undefined })} className={!c ? "on" : ""}>
            Everything
          </Link>
          {cats.map(([name]) => (
            <Link key={name} href={href({ c: name, page: undefined })} className={c === name ? "on" : ""}>
              {name}
            </Link>
          ))}
        </nav>
      )}

      <div className="toolbar">
        <span className="muted">
          {res.pages > 1 ? `Page ${res.page} of ${res.pages}` : `${res.total} products`}
        </span>
        <SortSelect value={sort} />
      </div>

      {res.items.length ? (
        <div className="grid">
          {res.items.map((p, i) => (
            <Fragment key={p.id}>
              <ProductCard p={p} />
              {i === 11 && res.items.length > 16 && <AdStrip index={res.page - 1} />}
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="empty">
          <p className="h2" style={{ color: "var(--ink)" }}>
            No products found
          </p>
          <p>Try another word or browse a category.</p>
        </div>
      )}

      <Pager page={res.page} pages={res.pages} href={(n) => href({ page: n === 1 ? undefined : String(n) })} />
    </div>
  );
}
