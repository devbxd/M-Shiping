"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// key = productId, or productId:vid when a colour/size was chosen
export type CartLine = {
  key: string;
  productId: string;
  vid?: string;
  variant?: string;
  title: string;
  image: string;
  price: number;
  qty: number;
};

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (l: Omit<CartLine, "qty" | "key">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "ms-bag-v2";
const keyOf = (l: { productId: string; vid?: string }) => (l.vid ? `${l.productId}:${l.vid}` : l.productId);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const value: Ctx = {
    lines,
    ready,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
    add: (l, qty = 1) =>
      setLines((prev) => {
        const key = keyOf(l);
        const found = prev.find((x) => x.key === key);
        if (found) return prev.map((x) => (x.key === key ? { ...x, qty: Math.min(10, x.qty + qty) } : x));
        return [...prev, { ...l, key, qty }];
      }),
    setQty: (key, qty) =>
      setLines((prev) => prev.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(10, qty)) } : x))),
    remove: (key) => setLines((prev) => prev.filter((x) => x.key !== key)),
    clear: () => setLines([]),
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export function BagLink() {
  const { count, ready } = useCart();
  return (
    <a href="/bag">
      Bag{ready && count > 0 && <span className="bag-count">{count}</span>}
    </a>
  );
}
