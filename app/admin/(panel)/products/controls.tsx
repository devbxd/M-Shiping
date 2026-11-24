"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PriceControls({ id, margin, isCustom, canLive }: { id: string; margin: number; isCustom: boolean; canLive: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(margin.toFixed(2));
  const [busy, setBusy] = useState<"" | "save" | "live">("");
  const [msg, setMsg] = useState("");

  async function send(body: object, kind: "save" | "live") {
    setBusy(kind);
    setMsg("");
    const res = await fetch(`/api/admin/pricing/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setMsg(json.error ?? "Error");
    setMsg(kind === "live" ? "Live price updated" : "Saved");
    router.refresh();
  }

  return (
    <div className="pc">
      <label>
        Margin $
        <input
          type="number"
          step="0.5"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send({ margin: Number(value) }, "save")}
        />
      </label>
      <button className="btn" disabled={!!busy} onClick={() => send({ margin: Number(value) }, "save")}>
        {busy === "save" ? "…" : "Save"}
      </button>
      {isCustom && (
        <button className="text-btn" disabled={!!busy} onClick={() => send({ margin: null }, "save")}>
          Reset
        </button>
      )}
      {canLive && (
        <button className="btn ghost" disabled={!!busy} onClick={() => send({ live: true }, "live")}>
          {busy === "live" ? "Checking…" : "Check live price"}
        </button>
      )}
      {msg && <span className="pc-msg">{msg}</span>}
    </div>
  );
}
