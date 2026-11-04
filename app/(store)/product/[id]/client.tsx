"use client";
import { img } from "@/lib/img";
import { useState } from "react";
import { useCart, type CartLine } from "@/components/Cart";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  return (
    <div className={"gallery" + (images.length < 2 ? " single" : "")}>
      <div className="stage">
        <img src={img(images[i], 1000)} alt={title} />
      </div>
      <div className="thumbs">
        {images.map((src, n) => (
          <button key={src} className={n === i ? "on" : ""} onClick={() => setI(n)} aria-label={`Image ${n + 1}`}>
            <img src={img(src, 500)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function BuyBox({ line }: { line: Omit<CartLine, "qty"> }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="buy-row">
        <div className="qty">
          <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Less">
            −
          </button>
          <span>{qty}</span>
          <button onClick={() => setQty(Math.min(10, qty + 1))} aria-label="More">
            +
          </button>
        </div>
        <button
          className="btn"
          onClick={() => {
            add(line, qty);
            setAdded(true);
          }}
        >
          Add to bag
        </button>
      </div>
      {added && (
        <span style={{ fontSize: 13.5 }}>
          Added. <a href="/bag" className="link-arrow">Go to bag</a>
        </span>
      )}
    </div>
  );
}
