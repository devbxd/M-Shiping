import Link from "next/link";
import { DEPARTMENTS, departmentName } from "@/lib/config";
import { categoriesOf, departmentCounts, queryProducts, type Sort } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

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
  const counts = departmentCounts();
  const cats = categoriesOf(d);

  const href = (patch: Record<string, string | undefined>) => {
    const next = { d, c, q, sort: sort === "new" ? undefined : sort, ...patch };
    const s = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return "/shop" + (s ? "?" + s : "");
  };

  const title = q ? `“${q}”` : d ? departmentName(d) : "Everything";

  return (
    <div className="wrap">
      <div className="shop-head">
        <span className="eyebrow">
          {q ? "Search" : "Shop"} · <span className="num">{res.total}</span> products
        </span>
        <h1 className="display">{title}</h1>
      </div>
      <div className="shop">
        <aside className="filters">
          <div>
            <h5 className="eyebrow">Department</h5>
            <ul>
              <li>
                <Link href={href({ d: undefined, c: undefined, page: undefined })} className={!d ? "on" : ""}>
                  <span>All</span>
                </Link>
              </li>
              {DEPARTMENTS.map((x) => (
                <li key={x.slug}>
                  <Link href={href({ d: x.slug, c: undefined, page: undefined })} className={d === x.slug ? "on" : ""}>
                    <span>{x.name}</span>
                    <span>{counts[x.slug] ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {cats.length > 1 && (
            <div>
              <h5 className="eyebrow">Category</h5>
              <ul>
                {cats.map(([name, n]) => (
                  <li key={name}>
                    <Link href={href({ c: c === name ? undefined : name, page: undefined })} className={c === name ? "on" : ""}>
                      <span>{name}</span>
                      <span>{n}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <div>
          <div className="toolbar">
            <span className="muted">
              Page {res.page} of {res.pages}
            </span>
            <div className="sorts">
              {(
                [
                  ["new", "Newest"],
                  ["rating", "Best rated"],
                  ["price-asc", "Price, low"],
                  ["price-desc", "Price, high"],
                ] as const
              ).map(([k, label]) => (
                <Link key={k} href={href({ sort: k === "new" ? undefined : k, page: undefined })} className={sort === k ? "on" : ""}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          {res.items.length ? (
            <div className="grid">
              {res.items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p className="h2" style={{ color: "var(--ink)" }}>
                Nothing here yet.
              </p>
              <p>Try another word, or browse a department.</p>
            </div>
          )}
          {res.pages > 1 && (
            <nav className="pager" aria-label="Pages">
              {Array.from({ length: res.pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={href({ page: n === 1 ? undefined : String(n) })} className={n === res.page ? "on" : ""}>
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
