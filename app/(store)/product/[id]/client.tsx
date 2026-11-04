"use client";
import { img } from "@/lib/img";
import { useMemo, useState, type ReactNode } from "react";
import { useCart } from "@/components/Cart";
import { money } from "@/lib/format";
import { variantLabel, type Variant } from "@/lib/types";

type Props = {
  id: string;
  title: string;
  kicker: string;
  images: string[];
  price: number;
  compareAt?: number;
  variants?: Variant[];
  children: ReactNode; // description + facts, rendered by the server
};

export function ProductView({ id, title, kicker, images, price, compareAt, variants = [], children }: Props) {
  const { add } = useCart();
  const dims = useMemo(() => {
    const order: string[] = [];
    const values: Record<string, string[]> = {};
    for (const v of variants)
      for (const [k, val] of Object.entries(v.options)) {
        if (!values[k]) (values[k] = []), order.push(k);
        if (!values[k].includes(val)) values[k].push(val);
      }
    return order.map((k) => ({ name: k, values: values[k] }));
  }, [variants]);

  // pre-select dimensions that only have one value
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(dims.filter((d) => d.values.length === 1).map((d) => [d.name, d.values[0]])),
  );
  const [image, setImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [needPick, setNeedPick] = useState(false);

  const chosen = variants.length
    ? variants.find((v) => dims.every((d) => v.options[d.name] === picked[d.name]))
    : undefined;
  const complete = !variants.length || !!chosen;
  const shownPrice = chosen?.price ?? price;

  // a value is available if some variant matches it plus the other picks
  const available = (dim: string, val: string) =>
    variants.some((v) => v.options[dim] === val && dims.every((d) => d.name === dim || !picked[d.name] || v.options[d.name] === picked[d.name]));

  const gallery = chosen?.image && !images.includes(chosen.image) ? [chosen.image, ...images] : images;
  const stage = chosen?.image ?? gallery[image] ?? gallery[0];

  function pick(dim: string, val: string) {
    setPicked((p) => ({ ...p, [dim]: p[dim] === val ? "" : val }));
    setAdded(false);
    setNeedPick(false);
  }

  function addToBag() {
    if (!complete) return setNeedPick(true);
    add(
      {
        productId: id,
        vid: chosen?.vid,
        variant: chosen ? variantLabel(chosen) : undefined,
        title,
        image: chosen?.image ?? images[0],
        price: shownPrice,
      },
      qty,
    );
    setAdded(true);
  }

  return (
    <div className="pdp">
      <div className={"gallery" + (gallery.length < 2 ? " single" : "")}>
        <div className="stage">
          <img src={img(stage, 1000)} alt={title} />
        </div>
        <div className="thumbs">
          {gallery.map((src, n) => (
            <button
              key={src}
              className={src === stage ? "on" : ""}
              onClick={() => {
                setImage(n);
                if (chosen?.image) setPicked((p) => ({ ...p, [dims[0].name]: "" }));
              }}
              aria-label={`Image ${n + 1}`}
            >
              <img src={img(src, 500)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <div className="buy">
        <span className="eyebrow">{kicker}</span>
        <h1 className="display">{title}</h1>
        <span className="price">
          {money(shownPrice)}
          {compareAt && !chosen && <s>{money(compareAt)}</s>}
        </span>

        {dims.map((d) => (
          <div className="opt" key={d.name}>
            <div className="opt-head">
              <span>{d.name}</span>
              <b>{picked[d.name] || ""}</b>
            </div>
            <div className="opt-values">
              {d.values.map((val) => {
                const ok = available(d.name, val);
                return (
                  <button
                    key={val}
                    type="button"
                    className={(picked[d.name] === val ? "on " : "") + (ok ? "" : "off")}
                    disabled={!ok}
                    onClick={() => pick(d.name, val)}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

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
            <button className="btn" onClick={addToBag}>
              Add to bag
            </button>
          </div>
          {needPick && !complete && (
            <span className="error">Choose {dims.filter((d) => !picked[d.name]).map((d) => d.name.toLowerCase()).join(" and ")} first.</span>
          )}
          {added && (
            <span style={{ fontSize: 14 }}>
              Added to your bag. <a href="/bag" className="link-arrow">View bag</a>
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
