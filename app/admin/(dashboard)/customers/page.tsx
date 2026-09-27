import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { orders: true },
  });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Customers</h1>
          <p>Customer history, repeat business and contact profile.</p>
        </div>
      </div>

      <div className="admin-card">
        {customers.length === 0 ? (
          <div className="admin-empty">No customers yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <Link href={`/customers/${customer.id}`}>{customer.name ?? "—"}</Link>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone ?? "—"}</td>
                  <td>{customer.orders.length}</td>
                  <td>{customer.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
