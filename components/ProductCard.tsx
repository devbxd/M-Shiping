import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";

export function ProductCard({ p }: { p: Product }) {
  const alt = p.images[1];
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  return (
    <Link href={`/product/${p.id}`} className="card">
      <div className="card-img">
        <img className={"main" + (alt ? " has-alt" : "")} src={p.images[0]} alt={p.title} loading="lazy" />
        {alt && <img className="alt" src={alt} alt="" loading="lazy" aria-hidden />}
        {off >= 10 && <span className="card-flag sale">−{off}%</span>}
      </div>
      <div className="card-body">
        <span className="card-cat">{p.brand || p.category}</span>
        <span className="card-title">{p.title}</span>
        <span className="price">
          {money(p.price)}
          {p.compareAt && <s>{money(p.compareAt)}</s>}
        </span>
      </div>
    </Link>
  );
}
