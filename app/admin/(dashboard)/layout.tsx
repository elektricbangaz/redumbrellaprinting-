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
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/customers">Customers</Link>
          <Link href="/admin/quotes">Quotes</Link>
          <Link href="/admin/design-approvals">Design Approvals</Link>
          <Link href="/admin/inventory">Inventory</Link>
          <Link href="/admin/invoices">Invoices</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/work-orders">Work Orders</Link>
          <Link href="/admin/purchase-orders">Purchase Orders</Link>
          <Link href="/admin/broadcasts">Broadcasts</Link>
        </nav>
        <div className="admin-user">
          <div>
            <strong>{session.user.name ?? "Admin"}</strong>
            <small>{session.user.email}</small>
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
