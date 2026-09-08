import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          RED UMBRELLA
          <span>Admin</span>
        </div>
        <nav className="admin-nav">
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/work-orders">Work Orders</Link>
          <Link href="/admin/purchase-orders">Purchase Orders</Link>
          <Link href="/admin/broadcasts">Broadcasts</Link>
        </nav>
        <div className="admin-user">
          <div>
            <strong>{session?.user?.name ?? "Admin"}</strong>
            <small>{session?.user?.email}</small>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button className="admin-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
