"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { shelfPrice } from "@/lib/pricing";

const usd = (n: number) => "$" + n.toFixed(2);

export function MarginEditor({ id, cost, margin, isCustom }: { id: string; cost: number; margin: number; isCustom: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(margin);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const changed = Math.abs(value - margin) > 0.001;
  const preview = shelfPrice(cost, value);

  async function save(m: number | null) {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/admin/pricing/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ margin: m }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(json.error ?? "Could not save");
    setMsg("Saved — the price is live on the site");
    if (m === null) setValue(3.5);
    router.refresh();
  }

  const step = (d: number) => setValue((v) => Math.max(0, Math.round((v + d) * 2) / 2));

  return (
    <div className="me">
      <div className="me-row">
        <span className="me-label">Your profit per sale</span>
        <div className="me-stepper">
          <button type="button" onClick={() => step(-0.5)} aria-label="Less profit">
            −
          </button>
          <input
            type="number"
            step="0.5"
            min="0"
            value={value}
            onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Profit in dollars"
          />
          <button type="button" onClick={() => step(0.5)} aria-label="More profit">
            +
          </button>
        </div>
      </div>
      {changed && (
        <div className="me-preview">
          New price on the site: <b>{usd(preview)}</b>
          <span className="muted"> (now {usd(shelfPrice(cost, margin))})</span>
        </div>
      )}
      <div className="me-actions">
        <button className="btn" disabled={busy || !changed} onClick={() => save(value)}>
          {busy ? "Saving…" : "Save new price"}
        </button>
        {isCustom && (
          <button className="text-btn" disabled={busy} onClick={() => save(null)}>
            Back to default ($3.50)
          </button>
        )}
      </div>
      {msg && <div className="me-msg">{msg}</div>}
    </div>
  );
}

export function LiveCheck({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function check() {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/admin/pricing/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ live: true }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(json.error ?? "Could not reach the supplier");
    router.refresh();
  }
  return (
    <>
      <button className="btn ghost sm" disabled={busy} onClick={check}>
        {busy ? "Asking the supplier…" : "Check supplier price now"}
      </button>
      {msg && <span className="me-msg err">{msg}</span>}
    </>
  );
}
