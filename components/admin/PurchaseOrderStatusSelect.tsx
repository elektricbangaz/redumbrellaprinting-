"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["DRAFT", "SENT", "RECEIVED", "CANCELLED"];

export function PurchaseOrderStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState("");

  async function onChange(next: string) {
    const previous = current;
    setCurrent(next); setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/purchase-orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not update purchase order.");
      router.refresh();
    } catch (err) {
      setCurrent(previous);
      setError(err instanceof Error ? err.message : "Could not update purchase order.");
    } finally { setSaving(false); }
  }

  return <div className="po-status-control"><select value={current} disabled={saving || current === "RECEIVED"} onChange={(e) => onChange(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>{error && <small>{error}</small>}</div>;
}
