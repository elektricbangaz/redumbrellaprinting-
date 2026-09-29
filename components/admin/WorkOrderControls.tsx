"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const STAGES = [
  ["SUBMITTED", "Submitted"],
  ["REVIEW", "Under review"],
  ["NEEDS_CUSTOMER_APPROVAL", "Needs customer approval"],
  ["APPROVED", "Approved"],
  ["QUEUED", "Queued"],
  ["IN_PROGRESS", "In production"],
  ["QUALITY_CHECK", "Quality check"],
  ["READY", "Ready for pickup"],
  ["COMPLETED", "Completed"],
  ["ON_HOLD", "On hold"],
  ["CANCELLED", "Cancelled"],
] as const;

const NEXT_STAGES: Record<string, string[]> = {
  SUBMITTED: ["REVIEW", "CANCELLED"],
  REVIEW: ["NEEDS_CUSTOMER_APPROVAL", "APPROVED", "ON_HOLD", "CANCELLED"],
  NEEDS_CUSTOMER_APPROVAL: ["REVIEW", "APPROVED", "ON_HOLD", "CANCELLED"],
  APPROVED: ["QUEUED", "ON_HOLD", "CANCELLED"],
  QUEUED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["QUALITY_CHECK", "ON_HOLD", "CANCELLED"],
  QUALITY_CHECK: ["IN_PROGRESS", "READY", "ON_HOLD", "CANCELLED"],
  READY: ["IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"],
  COMPLETED: [],
  ON_HOLD: ["REVIEW", "NEEDS_CUSTOMER_APPROVAL", "APPROVED", "QUEUED", "IN_PROGRESS", "QUALITY_CHECK", "READY", "CANCELLED"],
  CANCELLED: [],
};

export function WorkOrderControls({
  id,
  stage,
  priority,
  assignedTo,
  dueDate,
  productionMethod,
  placement,
  blockedReason,
  paymentStatus,
}: {
  id: string;
  stage: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
  productionMethod: string | null;
  placement: string | null;
  blockedReason: string | null;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: form.get("stage"),
          priority: form.get("priority"),
          assignedTo: form.get("assignedTo") || null,
          dueDate: form.get("dueDate") || null,
          productionMethod: form.get("productionMethod") || null,
          placement: form.get("placement") || null,
          blockedReason: form.get("blockedReason") || null,
          note: form.get("note") || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "The job could not be updated.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("The job could not be updated. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="job-controls">
      <summary>Manage job</summary>
      <form onSubmit={submit}>
        <label>Workflow stage
          <select name="stage" defaultValue={stage}>
            {STAGES.filter(([value]) => value === stage || (NEXT_STAGES[stage] ?? []).includes(value) && (value !== "IN_PROGRESS" || paymentStatus === "PAID")).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <div className="job-controls-row">
          <label>Priority
            <select name="priority" defaultValue={priority}>
              <option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select>
          </label>
          <label>Due date<input name="dueDate" type="date" defaultValue={dueDate ?? ""} /></label>
        </div>
        <label>Assigned staff / station<input name="assignedTo" maxLength={120} defaultValue={assignedTo ?? ""} placeholder="Name or production station" /></label>
        <div className="job-controls-row">
          <label>Production method<input name="productionMethod" maxLength={120} defaultValue={productionMethod ?? ""} placeholder="DTF, embroidery…" /></label>
          <label>Print placement<input name="placement" maxLength={160} defaultValue={placement ?? ""} placeholder="Front, left chest…" /></label>
        </div>
        <label>Hold / exception reason<input name="blockedReason" maxLength={1000} defaultValue={blockedReason ?? ""} placeholder="Required when placing a job on hold" /></label>
        <label>Update note<textarea name="note" maxLength={1000} rows={2} placeholder="Optional note added to the job history" /></label>
        {error && <p className="job-control-feedback error" role="alert">{error}</p>}
        {saved && <p className="job-control-feedback success" role="status">Job saved and history recorded.</p>}
        <button className="button button-red job-save" type="submit" disabled={saving}>{saving ? "Saving…" : "Save job update"}</button>
      </form>
    </details>
  );
}
