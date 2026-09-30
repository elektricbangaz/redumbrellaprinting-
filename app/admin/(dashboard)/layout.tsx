import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CalendarDays, ChevronDown, FileText, LogOut, Plus, Search } from "lucide-react";
import { auth, signOut } from "@/auth";
import AdminSidebar from "./AdminSidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userName = session.user.name ?? "Administrator";
  const initials = userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const today = new Date().toLocaleDateString("en-JM", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="admin-shell ru-shell">
      <AdminSidebar />
      <div className="admin-main ru-main">
        <header className="admin-topbar ru-topbar">
          <form className="ru-global-search" action="/job-queue">
            <Search size={16} />
            <input name="q" aria-label="Search jobs, customers, orders or job number" placeholder="Search jobs, customers, orders, or job #..." />
            <kbd>⌘ K</kbd>
          </form>
          <div className="ru-top-actions">
            <Link href="/orders/new" className="ru-new-job"><Plus size={16}/> New Job <ChevronDown size={13}/></Link>
            <Link href="/quotes/new" className="ru-quick-quote"><FileText size={15}/> Quick Quote</Link>
            <Link href="/job-queue?stage=OVERDUE" className="ru-icon-button" aria-label="Notifications"><Bell size={17}/><i>3</i></Link>
            <span className="ru-date"><CalendarDays size={15}/>{today}</span>
            <div className="admin-profile ru-profile">
              <span className="admin-avatar">{initials}</span>
              <span className="admin-profile-copy"><strong>{userName}</strong><small>Administrator</small></span>
            </div>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button className="admin-signout ru-signout" type="submit" aria-label="Sign out"><LogOut size={16}/></button>
            </form>
          </div>
        </header>
        <main className="admin-content ru-content">{children}</main>
      </div>
    </div>
  );
}
