import { img } from "@/lib/img";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { date, money, STATUS_LABEL } from "@/lib/format";
import { OrderActions } from "../../client";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const o = getOrder((await params).id);
  if (!o) notFound();
  const cost = o.items.reduce((t, i) => t + i.cost * i.qty, 0);
  const wa = "https://wa.me/" + o.customer.phone.replace(/\D/g, "").replace(/^0+/, "").replace(/^(?!961)/, "961");

  return (
    <>
      <div className="admin-title">
        <div>
          <Link href="/admin" className="eyebrow">
            ← Orders
          </Link>
          <h1 className="num" style={{ fontFamily: "var(--mono)", fontSize: 30 }}>{o.id}</h1>
        </div>
        <span className={`pill ${o.status}`} style={{ fontSize: 14 }}>
          {STATUS_LABEL[o.status]}
        </span>
      </div>

      <div className="admin-grid">
        <div style={{ display: "grid", gap: 20 }}>
          <div className="panel">
            <div className="panel-head">
              <span className="eyebrow">Items to buy</span>
              <span className="muted" style={{ fontSize: 13 }}>Open each link and order it for the customer</span>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Product</th>
                    <th className="r">Qty</th>
                    <th className="r">Sold</th>
                    <th className="r">Cost</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.productId + (i.vid ?? "")}>
                      <td style={{ width: 60 }}>
                        <div className="mini-thumb">
                          <img src={img(i.image, 120)} alt="" />
                        </div>
                      </td>
                      <td>
                        {i.title}
                        {(i.variant || i.sku) && (
                          <div style={{ marginTop: 4, fontSize: 13 }}>
                            {i.variant && <b style={{ fontWeight: 600 }}>{i.variant}</b>}
                            {i.sku && <span className="muted"> · SKU {i.sku}</span>}
                          </div>
                        )}
                      </td>
                      <td className="r num">{i.qty}</td>
                      <td className="r num">{money(i.price * i.qty)}</td>
                      <td className="r num muted">{money(i.cost * i.qty)}</td>
                      <td>
                        {i.supplierUrl ? (
                          <a href={i.supplierUrl} target="_blank" rel="noreferrer" className="link-arrow">
                            Open on {i.supplier}
                          </a>
                        ) : (
                          <span className="muted">{i.supplier}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-box" style={{ borderTop: "1px solid var(--line)" }}>
              <dl>
                <dt>Subtotal</dt>
                <dd className="num">{money(o.subtotal)}</dd>
                <dt>Delivery</dt>
                <dd className="num">{money(o.delivery)}</dd>
                <dt>Total</dt>
                <dd className="num">{money(o.total)}</dd>
                <dt>Cost</dt>
                <dd className="num muted">{money(cost)}</dd>
                <dt>Margin</dt>
                <dd className="num" style={{ color: "var(--cedar)" }}>
                  {money(o.total - cost)} ({Math.round(((o.total - cost) / o.total) * 100)}%)
                </dd>
              </dl>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="eyebrow">History</span>
            </div>
            <div className="admin-box">
              <ul className="timeline">
                {o.history.map((h, n) => (
                  <li key={n}>
                    <time>{date(h.at)}</time>
                    <span>
                      {STATUS_LABEL[h.status]}
                      {h.note ? <span className="muted"> — {h.note}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div className="panel">
            <div className="admin-box">
              <span className="eyebrow">Customer</span>
              <dl>
                <dt>Name</dt>
                <dd>{o.customer.name}</dd>
                <dt>Phone</dt>
                <dd>
                  <a href={wa} target="_blank" rel="noreferrer" className="link-arrow num">
                    {o.customer.phone}
                  </a>
                </dd>
                {o.customer.email && (
                  <>
                    <dt>Email</dt>
                    <dd>{o.customer.email}</dd>
                  </>
                )}
                <dt>Region</dt>
                <dd>{o.customer.city}</dd>
                <dt>Address</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>{o.customer.address}</dd>
                <dt>Payment</dt>
                <dd>{o.payment === "cod" ? "Cash on delivery" : "Whish Money"}</dd>
                {o.customer.notes && (
                  <>
                    <dt>Note</dt>
                    <dd style={{ whiteSpace: "pre-wrap" }}>{o.customer.notes}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
          <div className="panel">
            <OrderActions order={o} />
          </div>
        </div>
      </div>
    </>
  );
}
