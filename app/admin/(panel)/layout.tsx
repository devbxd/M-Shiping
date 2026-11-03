import Link from "next/link";
import { Logo } from "@/components/Chrome";
import { listOrders } from "@/lib/orders";
import { allProducts } from "@/lib/products";
import { LogoutButton } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pending = listOrders("pending").length;
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/admin">
          <Logo />
        </Link>
        <nav>
          <Link href="/admin">
            Orders {pending > 0 && <b className="hot">{pending} new</b>}
          </Link>
          <Link href="/admin/products">
            Catalog <b>{allProducts().length}</b>
          </Link>
          <Link href="/" target="_blank">
            View store
          </Link>
        </nav>
        <div className="foot">
          <LogoutButton />
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
