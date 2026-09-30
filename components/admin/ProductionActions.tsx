"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Pause, Play, RotateCcw, Scissors, ShieldCheck } from "lucide-react";

type Action = "START" | "PAUSE" | "RESUME" | "PROGRESS" | "MOVE_PHASE" | "MARK_QC" | "MARK_READY" | "COMPLETE";

export function ProductionActions({ id, progress, phase, compact = false }: { id: string; progress: number; phase: string; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [value, setValue] = useState(progress);
  const [error, setError] = useState("");

  async function run(action: Action, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setError("");
    try {
      const res = await fetch("/api/admin/work-orders/" + id + "/action", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error || "Update failed."); return; }
      router.refresh();
    } catch {
      setError("Update failed. Check the connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={"ru-production-actions" + (compact ? " compact" : "")}>
      {!compact && <div className="ru-progress-control"><label>Progress <strong>{value}%</strong></label><input type="range" min="0" max="100" step="5" value={value} onChange={(e) => setValue(Number(e.target.value))}/><button onClick={() => run("PROGRESS", { progress: value })} disabled={!!busy}>Update Progress</button></div>}
      <div className="ru-action-grid">
        <button className="primary" onClick={() => run("START", { phase })} disabled={!!busy}><Play size={14}/> Start Job</button>
        <button onClick={() => run("PAUSE")} disabled={!!busy}><Pause size={14}/> Pause</button>
        <button onClick={() => run("RESUME", { phase })} disabled={!!busy}><RotateCcw size={14}/> Resume</button>
        <button onClick={() => run("MOVE_PHASE", { phase: "FINISHING" })} disabled={!!busy}><Scissors size={14}/> Move to Finishing</button>
        <button onClick={() => run("MARK_QC")} disabled={!!busy}><ShieldCheck size={14}/> Mark QC Ready</button>
        <button onClick={() => run("MARK_READY")} disabled={!!busy}><Check size={14}/> Mark Ready</button>
      </div>
      {error && <p className="ru-action-error">{error}</p>}
    </div>
  );
}
