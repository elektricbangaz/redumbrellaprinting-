"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STAGES = ["QUEUED", "IN_PROGRESS", "QUALITY_CHECK", "COMPLETED"];

export function WorkOrderStageSelect({ id, stage }: { id: string; stage: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    setSaving(true);
    await fetch(`/api/admin/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select value={stage} disabled={saving} onChange={(e) => onChange(e.target.value)}>
      {STAGES.map((s) => (
        <option key={s} value={s}>
          Move to: {s.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
