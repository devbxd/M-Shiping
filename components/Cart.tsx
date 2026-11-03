"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartLine = { id: string; title: string; image: string; price: number; qty: number };

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (l: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "ms-bag-v1";

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
        const found = prev.find((x) => x.id === l.id);
        if (found) return prev.map((x) => (x.id === l.id ? { ...x, qty: Math.min(10, x.qty + qty) } : x));
        return [...prev, { ...l, qty }];
      }),
    setQty: (id, qty) =>
      setLines((prev) => prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(10, qty)) } : x))),
    remove: (id) => setLines((prev) => prev.filter((x) => x.id !== id)),
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
