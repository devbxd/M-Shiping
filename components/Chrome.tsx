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

function DeptLinks() {
  return (
    <nav className="main-nav" aria-label="Departments">
      {DEPARTMENTS.map((d) => (
        <Link key={d.slug} href={`/shop?d=${d.slug}`}>
          {d.name}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  return (
    <>
      <div className="notice">
        <div className="wrap">
          <span className="long">Free delivery across Lebanon on orders over ${DELIVERY.freeAbove} &middot; Pay cash when it arrives</span>
          <span className="short">Free delivery over ${DELIVERY.freeAbove} &middot; Cash on delivery</span>
        </div>
      </div>
      <header className="header">
        <div className="wrap">
          <div className="header-row">
            <Link href="/" aria-label={SHOP.name + " home"}>
              <Logo />
            </Link>
            <DeptLinks />
            <div className="header-tools">
              <form className="search" action="/shop" role="search">
                <input name="q" placeholder="Search" aria-label="Search" type="search" />
              </form>
              <Link href="/shop#search" className="search-link">
                Search
              </Link>
              <BagLink />
            </div>
          </div>
        </div>
        <div className="mobile-nav">
          <div className="wrap">
            <DeptLinks />
          </div>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Logo />
            <p>Clothing, shoes, tech, beauty and home, delivered to your door anywhere in Lebanon.</p>
          </div>
          <div>
            <h6>Shop</h6>
            <ul>
              {DEPARTMENTS.slice(0, 6).map((d) => (
                <li key={d.slug}>
                  <Link href={`/shop?d=${d.slug}`}>{d.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6>Help</h6>
            <ul>
              <li>Delivery in {DELIVERY.estimate}</li>
              <li>Cash on delivery</li>
              <li>Whish Money</li>
              <li>
                <Link href="/bag">Your bag</Link>
              </li>
            </ul>
          </div>
          <div>
            <h6>Contact</h6>
            <ul>
              <li>
                <a href={SHOP.whatsappLink} target="_blank" rel="noopener">
                  WhatsApp {SHOP.whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>
            &copy; {new Date().getFullYear()} {SHOP.name}
          </span>
          <span>Prices in USD</span>
        </div>
      </div>
    </footer>
  );
}
