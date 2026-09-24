import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          RED UMBRELLA
          <span>Admin</span>
        </div>
        <nav className="admin-nav">
          <Link href="/orders">Orders</Link>
          <Link href="/work-orders">Work Orders</Link>
          <Link href="/purchase-orders">Purchase Orders</Link>
          <Link href="/broadcasts">Broadcasts</Link>
        </nav>
        <div className="admin-user">
          <div>
            <strong>{session.user.name ?? "Admin"}</strong>
            <small>{session.user.email}</small>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
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
