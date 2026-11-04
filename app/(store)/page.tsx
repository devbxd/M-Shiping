import { img } from "@/lib/img";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/config";
import { queryProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { HeroSlider, type Slide } from "@/components/HeroSlider";
import { AdCards, AdStrip } from "@/components/Ads";
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

const SLIDES: Omit<Slide, "images">[] = [
  { kicker: "Women", title: "The new season edit", text: "Dresses, tops, bags and jewellery, delivered anywhere in Lebanon.", cta: "Shop women", href: "/shop?d=women", bg: "var(--blush)" },
  { kicker: "Shoes", title: "Step into something new", text: "Sneakers, heels, sandals and boots from $11.", cta: "Shop shoes", href: "/shop?d=shoes", bg: "var(--sand)" },
  { kicker: "Tech", title: "Tech for less", text: "Earbuds, smart watches, chargers and gadgets that actually work.", cta: "Shop tech", href: "/shop?d=tech", bg: "var(--sage)" },
  { kicker: "Home", title: "Make home yours", text: "Bedding, lights, kitchen and storage for every room.", cta: "Shop home", href: "/shop?d=home", bg: "var(--lilac)" },
];

export default function Home() {
  const slides: Slide[] = SLIDES.map((s) => ({
    ...s,
    images: top(s.href.split("=")[1], 3).map((p) => p.images[0]),
  })).filter((s) => s.images.length === 3);
  const latest = queryProducts({ sort: "new", perPage: 8 }).items;

  return (
    <>
      {slides.length > 0 && <HeroSlider slides={slides} />}

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
                  <div className="cat-img">{p && <img src={img(p.images[0], 320)} alt="" loading="lazy" />}</div>
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
      <Rail title="Popular in tech" href="/shop?d=tech&sort=rating" items={top("tech", 8)} />

      <AdCards />

      <Rail title="Shoes everyone is buying" href="/shop?d=shoes&sort=rating" items={top("shoes", 8)} />
      <Rail title="For the home" href="/shop?d=home&sort=rating" items={top("home", 8)} />

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
            <Link href="/shop" className="btn">
              Start shopping
            </Link>
          </div>
        </div>
      </section>

      <Rail title="Kids" href="/shop?d=kids&sort=rating" items={top("kids", 8)} />
      <Rail title="Beauty" href="/shop?d=beauty&sort=rating" items={top("beauty", 8)} />

      <section className="section">
        <div className="wrap">
          <AdStrip index={2} />
        </div>
      </section>
      <div style={{ height: "clamp(56px, 7vw, 96px)" }} />
    </>
  );
}
