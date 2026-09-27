import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } },
      designs: { include: { product: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!customer) notFound();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>{customer.name ?? customer.email}</h1>
          <p>{customer.email}</p>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Profile</h3>
          <p>
            Phone: {customer.phone ?? "—"}
            <br />
            Address: {customer.address ?? "—"}
            <br />
            Joined: {customer.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Order summary</h3>
          <p>
            Total orders: {customer.orders.length}
            <br />
            Total spend: {formatJMD(customer.orders.reduce((sum, order) => sum + order.total, 0))}
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Recent orders</h3>
        {customer.orders.length === 0 ? (
          <div className="admin-empty">No purchase history.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatJMD(order.total)}</td>
                  <td>{order.status.replaceAll("_", " ")}</td>
                  <td>{order.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
