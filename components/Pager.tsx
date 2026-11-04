import Link from "next/link";

// 1 … 4 5 [6] 7 8 … 180  — never prints hundreds of page links.
export function Pager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((n) => n >= 1 && n <= pages));
  const list = [...nums].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 && <Link href={href(page - 1)} aria-label="Previous page">‹</Link>}
      {out.map((n, i) =>
        n === "gap" ? (
          <span key={"g" + i} className="gap">…</span>
        ) : (
          <Link key={n} href={href(n)} className={n === page ? "on" : ""}>
            {n}
          </Link>
        ),
      )}
      {page < pages && <Link href={href(page + 1)} aria-label="Next page">›</Link>}
    </nav>
  );
}
