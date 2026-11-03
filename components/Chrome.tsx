import Link from "next/link";
import { DELIVERY, DEPARTMENTS, SHOP } from "@/lib/config";
import { BagLink } from "./Cart";

export function Logo() {
  const [a, b] = SHOP.name.split("&");
  return (
    <span className="logo">
      {a}
      <em>&amp;</em>
      {b}
    </span>
  );
}

export function Header({ active }: { active?: string }) {
  return (
    <>
      <div className="notice">
        <div className="wrap">
          <span>Free delivery anywhere in Lebanon above ${DELIVERY.freeAbove}</span>
          <span>Pay cash on delivery · Every order confirmed by phone</span>
        </div>
      </div>
      <header className="header">
        <div className="wrap">
          <div className="header-row">
            <form className="search" action="/shop" role="search">
              <input name="q" placeholder="Search everything" aria-label="Search" />
            </form>
            <Link href="/" aria-label={SHOP.name + " home"}>
              <Logo />
            </Link>
            <div className="header-actions">
              <Link href="/shop">Shop</Link>
              <BagLink />
            </div>
          </div>
        </div>
        <div className="deptbar">
          <div className="wrap">
            <nav aria-label="Departments">
              <Link href="/shop" aria-current={active === "all" ? "page" : undefined}>
                All
              </Link>
              {DEPARTMENTS.map((d) => (
                <Link key={d.slug} href={`/shop?d=${d.slug}`} aria-current={active === d.slug ? "page" : undefined}>
                  {d.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  const [a, b] = SHOP.name.split("&");
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <h6 className="eyebrow">{SHOP.name}</h6>
            <p style={{ maxWidth: 360, margin: 0, color: "var(--ink-2)", fontSize: 14 }}>
              Millions of products from the world&rsquo;s largest marketplaces, chosen, checked and delivered to your
              door in Lebanon. You pay when it arrives.
            </p>
          </div>
          <div>
            <h6 className="eyebrow">Shop</h6>
            <ul>
              {DEPARTMENTS.slice(0, 5).map((d) => (
                <li key={d.slug}>
                  <Link href={`/shop?d=${d.slug}`}>{d.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="eyebrow">Help</h6>
            <ul>
              <li>Delivery: {DELIVERY.estimate}</li>
              <li>Cash on delivery</li>
              <li>Whish Money</li>
            </ul>
          </div>
          <div>
            <h6 className="eyebrow">Contact</h6>
            <ul>
              <li>WhatsApp {SHOP.whatsapp}</li>
              <li>{SHOP.email}</li>
            </ul>
          </div>
        </div>
        <div className="footer-big" aria-hidden>
          {a}
          <em>&amp;</em>
          {b}
        </div>
        <div className="footer-base">
          <span>&copy; {new Date().getFullYear()} {SHOP.name}. Beirut, Lebanon.</span>
          <span>Prices in USD, delivery included above ${DELIVERY.freeAbove}.</span>
        </div>
      </div>
    </footer>
  );
}
