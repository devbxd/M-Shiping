"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label="Sort"
      value={value}
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        if (e.target.value === "new") p.delete("sort");
        else p.set("sort", e.target.value);
        p.delete("page");
        router.push(path + (p.size ? "?" + p : ""));
      }}
    >
      <option value="new">Newest</option>
      <option value="rating">Best rated</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}
