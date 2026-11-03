import Link from "next/link";
import { DEPARTMENTS, DELIVERY } from "@/lib/config";
import { allProducts, departmentCounts, queryProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

function pick(dept: string, skip = 0) {
  return queryProducts({ department: dept, sort: "rating", perPage: 1 + skip }).items[skip];
}

export default function Home() {
  const total = allProducts().length;
  const counts = departmentCounts();
  const mosaic = [
    { p: pick("tech"), tag: "Tech" },
    { p: pick("shoes"), tag: "Shoes" },
    { p: pick("beauty"), tag: "Beauty" },
  ].filter((m) => m.p);
  const latest = queryProducts({ sort: "new", perPage: 8 }).items;
  const tech = queryProducts({ department: "tech", sort: "rating", perPage: 4 }).items;
  const women = queryProducts({ department: "women", sort: "rating", perPage: 4 }).items;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Beirut · Tripoli · Saida · Everywhere in between</span>
          <h1 className="display">
            The world&rsquo;s
            <br />
            shelves, <i>delivered</i>
            <br />
            to Lebanon.
          </h1>
          <div style={{ display: "grid", gap: 28 }}>
            <p>
              Clothing, shoes, tech, beauty and home &mdash; sourced from the largest marketplaces on earth, checked by
              us, and brought to your door. You pay only when it arrives.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/shop" className="btn">
                Start shopping
              </Link>
              <Link href="#how" className="btn ghost">
                How it works
              </Link>
            </div>
            <div className="hero-meta">
              <div>
                <b className="num">{total.toLocaleString()}</b>
                <span className="eyebrow">Products</span>
              </div>
              <div>
                <b>{DELIVERY.estimate}</b>
                <span className="eyebrow">To your door</span>
              </div>
              <div>
                <b>Cash</b>
                <span className="eyebrow">On delivery</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-mosaic">
          {mosaic.map(({ p, tag }) => (
            <Link key={p!.id} href={`/product/${p!.id}`}>
              <img src={p!.images[0]} alt={p!.title} />
              <span className="tag">{tag}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Departments</h2>
            <span className="eyebrow">{DEPARTMENTS.length} sections, one checkout</span>
          </div>
          <div className="dept-index">
            {DEPARTMENTS.map((d, i) => (
              <Link key={d.slug} href={`/shop?d=${d.slug}`}>
                <div className="row">
                  <span className="eyebrow num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="eyebrow num">{counts[d.slug] ?? 0} items</span>
                </div>
                <div>
                  <h3>{d.name}</h3>
                  <p>{d.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Just in</h2>
            <Link href="/shop" className="link-arrow">
              View all
            </Link>
          </div>
          <div className="grid">
            {latest.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {[
        { title: "Tech, well reviewed", dept: "tech", items: tech },
        { title: "Women, best rated", dept: "women", items: women },
      ].map((s) =>
        s.items.length ? (
          <section className="section" key={s.dept}>
            <div className="wrap">
              <div className="section-head">
                <h2 className="h2">{s.title}</h2>
                <Link href={`/shop?d=${s.dept}`} className="link-arrow">
                  Shop the department
                </Link>
              </div>
              <div className="grid">
                {s.items.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          </section>
        ) : null,
      )}

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">How an order works</h2>
            <span className="eyebrow">No card needed</span>
          </div>
          <div className="promise">
            {[
              ["01", "You order", "Fill your bag and leave your name, phone and address. Takes a minute."],
              ["02", "We call you", "A real person confirms the order, size and address with you by phone or WhatsApp."],
              ["03", "We source it", "We buy it from the supplier and follow it all the way to Lebanon."],
              ["04", "You pay at the door", "Cash on delivery or Whish. Nothing to pay before it arrives."],
            ].map(([n, h, t]) => (
              <div key={n}>
                <span className="eyebrow num">{n}</span>
                <h4>{h}</h4>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
