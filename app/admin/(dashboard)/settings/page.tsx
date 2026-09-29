import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  const checks = [
    ["Production database", Boolean(process.env.DATABASE_URL)],
    ["Outbound email", Boolean(process.env.RESEND_API_KEY)],
    ["Payment gateway configuration", Boolean(process.env.WIPAY_API_KEY || process.env.FYGARO_API_KEY)],
    ["Admin origin configured", Boolean(process.env.ADMIN_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL)],
  ] as const;
  return <>
    <div className="admin-header"><div><h1>Settings</h1><p>Account and service configuration status.</p></div></div>
    <div className="admin-grid-2"><section className="admin-card"><h2>Signed-in account</h2><p><strong>{session?.user?.name ?? "Admin"}</strong></p><p>{session?.user?.email ?? "—"}</p><p>Role: {(session?.user as { role?: string } | undefined)?.role ?? "Staff"}</p></section><section className="admin-card"><h2>Connected services</h2><div className="admin-settings-list">{checks.map(([label, ready]) => <div key={label}><span>{label}</span><strong className={ready ? "ready" : "not-ready"}>{ready ? "Configured" : "Not configured"}</strong></div>)}</div><small>Secret values are never displayed here.</small></section></div>
    <p className="admin-data-note">Business profile, tax, pricing rules, user permissions, and notification preferences do not yet have editable settings screens.</p>
  </>;
}
