import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { date, money, STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS: (OrderStatus | "all")[] = ["pending", "confirmed", "purchased", "shipped", "delivered", "cancelled", "all"];

export default async function Orders({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const s = ((await searchParams).s as OrderStatus | "all") || "pending";
  const all = listOrders();
  const shown = s === "all" ? all : all.filter((o) => o.status === s);
  const live = all.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((t, o) => t + o.total, 0);
  const margin = live.reduce((t, o) => t + o.items.reduce((m, i) => m + (i.price - i.cost) * i.qty, 0) + o.delivery, 0);
  const count = (st: string) => (st === "all" ? all.length : all.filter((o) => o.status === st).length);

  return (
    <>
      <div className="admin-title">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Orders</h1>
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          Orders arrive as &ldquo;To validate&rdquo;. Call the customer, then validate.
        </span>
      </div>

      <div className="kpis">
        <div>
          <span className="eyebrow">To validate</span>
          <b className="num">{count("pending")}</b>
        </div>
        <div>
          <span className="eyebrow">In progress</span>
          <b className="num">{count("confirmed") + count("purchased") + count("shipped")}</b>
        </div>
        <div>
          <span className="eyebrow">Revenue</span>
          <b className="num">{money(revenue)}</b>
        </div>
        <div>
          <span className="eyebrow">Est. margin</span>
          <b className="num">{money(margin)}</b>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="tabs">
            {TABS.map((t) => (
              <Link key={t} href={`/admin?s=${t}`} className={s === t ? "on" : ""}>
                {t === "all" ? "All" : STATUS_LABEL[t]} <span className="num muted">{count(t)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Customer</th>
                <th>Region</th>
                <th>Items</th>
                <th>Status</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="num" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                      {o.id}
                    </Link>
                  </td>
                  <td className="muted">{date(o.createdAt)}</td>
                  <td>
                    {o.customer.name}
                    <div className="muted num" style={{ fontSize: 12.5 }}>{o.customer.phone}</div>
                  </td>
                  <td>{o.customer.city}</td>
                  <td className="num">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td>
                    <span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="r num">{money(o.total)}</td>
                </tr>
              ))}
              {!shown.length && (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 40, textAlign: "center" }}>
                    No orders here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
