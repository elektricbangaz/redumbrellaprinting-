"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PayStubActions({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function simulatePayment() {
    setLoading(true);
    await fetch(`/api/orders/${orderNumber}/mark-paid`, { method: "POST" });
    router.push(`/order/${orderNumber}`);
  }

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
      <button className="button button-red" onClick={simulatePayment} disabled={loading}>
        {loading ? "Processing…" : "Simulate Successful Payment"}
      </button>
    </div>
  );
}
