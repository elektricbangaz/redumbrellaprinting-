"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Staff = { id: string; name: string; email: string; jobTitle: string | null; role: string; active: boolean; hourlyRate: number };
type Station = { id: string; name: string; area: string | null };
type Shift = { id: string; staffName: string; workstationName: string | null; startsAt: string; endsAt: string; status: string };
type Clock = { id: string; clockIn: string; workstationName: string | null } | null;

export function StaffOperations({ staff, workstations, shifts, currentClock, isAdmin }: {
  staff: Staff[];
  workstations: Station[];
  shifts: Shift[];
  currentClock: Clock;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [stationId, setStationId] = useState("");

  async function request(url: string, init: RequestInit) {
    setBusy(true); setMessage("");
    try {
      const res = await fetch(url, init);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Update failed.");
      router.refresh();
      return body;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
      return null;
    } finally { setBusy(false); }
  }

  async function clock(action: "CLOCK_IN" | "CLOCK_OUT") {
    await request("/api/admin/staff/clock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, workstationId: stationId || null }) });
  }

  async function addStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form);
    const body = await request("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), jobTitle: fd.get("jobTitle"), hourlyRateJmd: Number(fd.get("hourlyRateJmd")), role: fd.get("role") }) });
    if (body) { form.reset(); setMessage("Staff member created and invitation sent."); }
  }

  async function addStation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form);
    const body = await request("/api/admin/workstations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), area: fd.get("area") }) });
    if (body) form.reset();
  }

  async function addShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form);
    const starts = new Date(String(fd.get("startsAt")));
    const ends = new Date(String(fd.get("endsAt")));
    const body = await request("/api/admin/staff/shifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId: fd.get("staffId"), workstationId: fd.get("workstationId") || null, startsAt: starts.toISOString(), endsAt: ends.toISOString(), notes: fd.get("notes") }) });
    if (body) form.reset();
  }

  async function deactivate(id: string) {
    if (!window.confirm("Deactivate this staff account? They will no longer be able to sign in.")) return;
    await request(`/api/admin/staff/${id}`, { method: "DELETE" });
  }

  return <div className="staff-ops-grid">
    <section className="admin-card staff-clock-card">
      <div><h2>My Time Clock</h2><p>{currentClock ? `Clocked in since ${new Date(currentClock.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${currentClock.workstationName ? ` · ${currentClock.workstationName}` : ""}` : "Clock in before beginning your shift."}</p></div>
      {!currentClock && <select value={stationId} onChange={(e) => setStationId(e.target.value)}><option value="">No workstation</option>{workstations.map((station) => <option key={station.id} value={station.id}>{station.name}{station.area ? ` — ${station.area}` : ""}</option>)}</select>}
      <button className={currentClock ? "button button-outline" : "button button-red"} disabled={busy} onClick={() => clock(currentClock ? "CLOCK_OUT" : "CLOCK_IN")}>{currentClock ? "Clock Out" : "Clock In"}</button>
    </section>

    {isAdmin && <>
      <section className="admin-card"><h2>Add Staff</h2><form className="admin-form" onSubmit={addStaff}><div className="admin-form-row"><label>Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label></div><div className="admin-form-row"><label>Job title<input name="jobTitle" placeholder="Press operator, designer…" /></label><label>Hourly rate (JMD)<input name="hourlyRateJmd" type="number" min="0" step="1" defaultValue="0" /></label></div><div className="admin-form-row"><label>Portal role<select name="role" defaultValue="STAFF"><option value="STAFF">Staff</option><option value="ADMIN">Admin</option></select></label><span /></div><button className="button button-red" disabled={busy}>Create & Invite</button></form></section>
      <section className="admin-card"><h2>Workstations</h2><form className="admin-form" onSubmit={addStation}><div className="admin-form-row"><label>Name<input name="name" required placeholder="DTF Press 1" /></label><label>Area<input name="area" placeholder="Production floor" /></label></div><button className="button button-outline" disabled={busy}>Add Workstation</button></form><div className="staff-station-list">{workstations.map((station) => <span key={station.id}><b>{station.name}</b>{station.area && <small>{station.area}</small>}</span>)}</div></section>
      <section className="admin-card staff-shift-builder"><h2>Schedule Shift</h2><form className="admin-form" onSubmit={addShift}><div className="admin-form-row"><label>Staff<select name="staffId" required><option value="">Select staff</option>{staff.filter((person) => person.active).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Workstation<select name="workstationId"><option value="">Unassigned</option>{workstations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></label></div><div className="admin-form-row"><label>Start<input name="startsAt" type="datetime-local" required /></label><label>End<input name="endsAt" type="datetime-local" required /></label></div><label>Notes<input name="notes" /></label><button className="button button-red" disabled={busy}>Schedule Shift</button></form></section>
    </>}

    <section className="admin-card staff-shifts-table"><h2>Upcoming Shifts</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Staff</th><th>Station</th><th>Start</th><th>End</th><th>Status</th>{isAdmin && <th />}</tr></thead><tbody>{shifts.map((shift) => <tr key={shift.id}><td>{shift.staffName}</td><td>{shift.workstationName || "Unassigned"}</td><td>{new Date(shift.startsAt).toLocaleString()}</td><td>{new Date(shift.endsAt).toLocaleString()}</td><td><span className="ru-status-pill">{shift.status}</span></td>{isAdmin && <td><button className="admin-link-button" disabled={busy || shift.status === "CANCELLED"} onClick={() => request(`/api/admin/staff/shifts/${shift.id}`, { method: "DELETE" })}>Cancel</button></td>}</tr>)}</tbody></table>{!shifts.length && <div className="admin-empty">No upcoming shifts.</div>}</div></section>

    {isAdmin && <section className="admin-card staff-access-table"><h2>Access & Status</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Staff</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>{staff.map((person) => <tr key={person.id}><td>{person.name}<small>{person.email}</small></td><td>{person.role}</td><td><span className={person.active ? "ru-status-pill s-ready" : "ru-status-pill s-completed"}>{person.active ? "Active" : "Inactive"}</span></td><td>{person.active && <button className="admin-link-button" disabled={busy} onClick={() => deactivate(person.id)}>Deactivate</button>}</td></tr>)}</tbody></table></div></section>}
    {message && <p className="wave-save-message">{message}</p>}
  </div>;
}
