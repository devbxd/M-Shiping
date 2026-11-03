"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/types";

export function LogoutButton() {
  return (
    <button
      className="text-btn"
      style={{ color: "#8b857a", textAlign: "left" }}
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" });
        location.href = "/admin/login";
      }}
    >
      Sign out
    </button>
  );
}

// Next step for each status, with the button label shown to the admin.
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "confirmed", label: "Validate order" },
  confirmed: { to: "purchased", label: "Mark as bought from supplier" },
  purchased: { to: "shipped", label: "Mark as shipped" },
  shipped: { to: "delivered", label: "Mark as delivered" },
};

export function OrderActions({ order }: { order: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState(order.supplierOrderRef ?? "");
  const [tracking, setTracking] = useState(order.tracking ?? "");
  const [note, setNote] = useState(order.adminNote ?? "");
  const [saved, setSaved] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setSaved(false);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else alert("Could not save");
  }

  const next = NEXT[order.status];
  const closed = order.status === "cancelled" || order.status === "delivered";

  return (
    <div className="admin-box">
      <span className="eyebrow">Actions</span>
      <div className="actions">
        {next && (
          <button className="btn" disabled={busy} onClick={() => patch({ status: next.to, supplierOrderRef: ref, tracking })}>
            {next.label}
          </button>
        )}
        {!closed && (
          <button
            className="btn danger"
            disabled={busy}
            onClick={() => {
              const why = prompt("Reason for cancelling (optional)") ?? undefined;
              if (why !== undefined) patch({ status: "cancelled", note: why });
            }}
          >
            Cancel
          </button>
        )}
        {order.status === "cancelled" && (
          <button className="btn ghost" disabled={busy} onClick={() => patch({ status: "pending", note: "Reopened" })}>
            Reopen
          </button>
        )}
      </div>
      <div className="field">
        <label>Supplier order no.</label>
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. AliExpress 8123…" />
      </div>
      <div className="field">
        <label>Tracking</label>
        <input value={tracking} onChange={(e) => setTracking(e.target.value)} />
      </div>
      <div className="field">
        <label>Internal note</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="actions">
        <button
          className="btn ghost"
          disabled={busy}
          onClick={() => patch({ supplierOrderRef: ref, tracking, adminNote: note })}
        >
          Save details
        </button>
        {saved && <span className="muted" style={{ alignSelf: "center", fontSize: 13 }}>Saved</span>}
      </div>
    </div>
  );
}
