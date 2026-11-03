import Link from "next/link";
import { notFound } from "next/navigation";
import { DELIVERY, departmentName } from "@/lib/config";
import { getProduct, queryProducts } from "@/lib/products";
import { money } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { Gallery, BuyBox } from "./client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = getProduct((await params).id);
  return { title: p?.title ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const p = getProduct((await params).id);
  if (!p) notFound();
  const related = queryProducts({ category: p.category, sort: "rating", perPage: 5 }).items.filter((x) => x.id !== p.id).slice(0, 4);

  return (
    <div className="wrap">
      <div className="crumbs">
        <Link href="/shop">Shop</Link>/<Link href={`/shop?d=${p.department}`}>{departmentName(p.department)}</Link>/
        <Link href={`/shop?d=${p.department}&c=${encodeURIComponent(p.category)}`}>{p.category}</Link>
      </div>
      <div className="pdp">
        <Gallery images={p.images} title={p.title} />
        <div className="buy">
          <span className="eyebrow">{p.brand || p.category}</span>
          <h1 className="display">{p.title}</h1>
          <span className="price">
            {money(p.price)}
            {p.compareAt && <s>{money(p.compareAt)}</s>}
          </span>
          <p style={{ margin: 0, color: "var(--ink-2)", maxWidth: 520 }}>{p.description}</p>
          <BuyBox line={{ id: p.id, title: p.title, image: p.images[0], price: p.price }} />
          <div className="facts">
            <div>
              <span>Delivery</span>
              <span>{DELIVERY.estimate}, anywhere in Lebanon</span>
            </div>
            <div>
              <span>Delivery fee</span>
              <span>
                {money(DELIVERY.fee)}, free above {money(DELIVERY.freeAbove)}
              </span>
            </div>
            <div>
              <span>Payment</span>
              <span>Cash on delivery or Whish</span>
            </div>
            {p.rating && p.rating >= 4 ? (
              <div>
                <span>Rating</span>
                <span className="num">{p.rating.toFixed(1)} / 5</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <h2 className="h2">More in {p.category}</h2>
          </div>
          <div className="grid">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
