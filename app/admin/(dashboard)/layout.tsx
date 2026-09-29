import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import AdminSidebar from "./AdminSidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userName = session.user.name ?? "Admin";
  const initials = userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span>RED UMBRELLA <b>/</b> OPERATIONS</span>
            <strong>Control center</strong>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-live-status"><span /> System operational</div>
            <div className="admin-profile">
              <span className="admin-avatar">{initials}</span>
              <span className="admin-profile-copy"><strong>{userName}</strong><small>{session.user.email}</small></span>
            </div>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button className="admin-signout" type="submit" aria-label="Sign out"><LogOut size={17} /><span>Sign out</span></button>
            </form>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
