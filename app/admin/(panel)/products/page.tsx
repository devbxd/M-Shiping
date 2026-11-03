import Link from "next/link";
import { queryProducts } from "@/lib/products";
import { departmentName } from "@/lib/config";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Catalog({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const res = queryProducts({ q: sp.q, page: Number(sp.page) || 1, perPage: 50 });
  return (
    <>
      <div className="admin-title">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Catalog</h1>
        </div>
        <form className="search" style={{ minWidth: 240 }}>
          <input name="q" defaultValue={sp.q} placeholder="Search catalog" />
        </form>
      </div>
      <div className="panel">
        <div className="panel-head">
          <span className="eyebrow">
            <span className="num">{res.total}</span> products · import more with <code>npm run import:aliexpress</code>
          </span>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Product</th>
                <th>Department</th>
                <th className="r">Price</th>
                <th className="r">Cost</th>
                <th className="r">Margin</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {res.items.map((p) => (
                <tr key={p.id}>
                  <td style={{ width: 60 }}>
                    <div className="mini-thumb">
                      <img src={p.images[0]} alt="" loading="lazy" />
                    </div>
                  </td>
                  <td>
                    <Link href={`/product/${p.id}`} target="_blank">
                      {p.title}
                    </Link>
                  </td>
                  <td className="muted">{departmentName(p.department)}</td>
                  <td className="r num">{money(p.price)}</td>
                  <td className="r num muted">{money(p.cost)}</td>
                  <td className="r num">{Math.round(((p.price - p.cost) / p.price) * 100)}%</td>
                  <td>
                    {p.supplierUrl ? (
                      <a href={p.supplierUrl} target="_blank" rel="noreferrer" className="link-arrow">
                        {p.supplier}
                      </a>
                    ) : (
                      <span className="muted">{p.supplier}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {res.pages > 1 && (
        <nav className="pager">
          {Array.from({ length: res.pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/admin/products?page=${n}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`} className={n === res.page ? "on" : ""}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
