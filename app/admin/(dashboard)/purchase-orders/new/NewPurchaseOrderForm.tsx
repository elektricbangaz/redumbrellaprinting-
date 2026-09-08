"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { formatJMD } from "@/lib/money";

type LineItem = { description: string; quantity: number; unitCost: number };

export function NewPurchaseOrderForm() {
  const router = useRouter();
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitCost: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addRow() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitCost: 0 }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName,
          vendorEmail,
          notes,
          items: items
            .filter((i) => i.description.trim())
            .map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitCost: Math.round(i.unitCost * 100),
            })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create purchase order.");
      router.push("/admin/purchase-orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="checkout-error">{error}</div>}
      <div className="admin-form-row">
        <label>
          Vendor Name
          <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
        </label>
        <label>
          Vendor Email
          <input
            type="email"
            value={vendorEmail}
            onChange={(e) => setVendorEmail(e.target.value)}
          />
        </label>
      </div>

      <h4 style={{ marginBottom: 0 }}>Line Items</h4>
      {items.map((item, i) => (
        <div className="admin-form-row" key={i} style={{ alignItems: "flex-end" }}>
          <label style={{ flex: 3 }}>
            Description
            <input
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
            />
          </label>
          <label>
            Qty
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
            />
          </label>
          <label>
            Unit Cost (JMD)
            <input
              type="number"
              min={0}
              step="0.01"
              value={item.unitCost}
              onChange={(e) => updateItem(i, { unitCost: Number(e.target.value) || 0 })}
            />
          </label>
          <button
            type="button"
            className="admin-link-button"
            onClick={() => removeRow(i)}
            style={{ marginBottom: 10 }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="button button-outline" onClick={addRow}>
        + Add Line Item
      </button>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>

      <div className="summary-row total">
        <span>Total</span>
        <span>{formatJMD(Math.round(total * 100))}</span>
      </div>

      <button className="button button-red" type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create Purchase Order"}
      </button>
    </form>
  );
}
