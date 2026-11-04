import Link from "next/link";
import { DEPARTMENTS } from "@/lib/config";
import { queryProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const top = (department: string, n = 1) => queryProducts({ department, sort: "rating", perPage: n }).items;

function Rail({ title, href, items }: { title: string; href: string; items: Product[] }) {
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <h2 className="h2">{title}</h2>
          <Link href={href} className="link-arrow">
            See all
          </Link>
        </div>
        <div className="rail">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const heroA = top("shoes")[0];
  const heroB = top("tech")[0];
  const latest = queryProducts({ sort: "new", perPage: 8 }).items;

  return (
    <>
      <section className="campaign">
        {heroA && (
          <Link href="/shop?d=shoes" className="panel-promo" style={{ background: "var(--sand)" }}>
            <img src={heroA.images[0]} alt="" />
            <div className="copy">
              <h2>New season shoes</h2>
              <p>Sneakers, heels and everyday pairs, delivered across Lebanon.</p>
              <span className="btn light">Shop shoes</span>
            </div>
          </Link>
        )}
        {heroB && (
          <Link href="/shop?d=tech" className="panel-promo" style={{ background: "var(--sage)" }}>
            <img src={heroB.images[0]} alt="" />
            <div className="copy">
              <h2>Tech for less</h2>
              <p>Phones, earbuds, laptops and everything that charges.</p>
              <span className="btn light">Shop tech</span>
            </div>
          </Link>
        )}
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Shop by category</h2>
          </div>
          <div className="cats">
            {DEPARTMENTS.map((d) => {
              const p = top(d.slug)[0];
              return (
                <Link key={d.slug} href={`/shop?d=${d.slug}`} className="cat">
                  <div className="cat-img">{p && <img src={p.images[0]} alt="" loading="lazy" />}</div>
                  <span>{d.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">New in</h2>
            <Link href="/shop" className="link-arrow">
              See all
            </Link>
          </div>
          <div className="grid">
            {latest.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      <Rail title="Popular in women" href="/shop?d=women&sort=rating" items={top("women", 8)} />

      <section className="band">
        <div className="wrap">
          <h2>
            Order today.
            <br />
            Pay at your door.
          </h2>
          <div>
            <p>
              No card needed. We call you to confirm every order, then deliver it anywhere in Lebanon. Cash or Whish,
              when it arrives.
            </p>
            <Link href="/shop" className="btn light">
              Start shopping
            </Link>
          </div>
        </div>
      </section>

      <Rail title="Popular in tech" href="/shop?d=tech&sort=rating" items={top("tech", 8)} />
      <Rail title="For the home" href="/shop?d=home" items={top("home", 8)} />
      <Rail title="Beauty" href="/shop?d=beauty" items={top("beauty", 8)} />
      <div style={{ height: "clamp(56px, 7vw, 96px)" }} />
    </>
  );
}
