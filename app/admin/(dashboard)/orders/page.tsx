import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/badges";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Orders</h1>
          <p>{orders.length} order{orders.length === 1 ? "" : "s"} total</p>
        </div>
      </div>
      <div className="admin-card">
        {orders.length === 0 ? (
          <div className="admin-empty">No orders yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
                  </td>
                  <td>
                    {o.customerName}
                    <br />
                    <small style={{ color: "#888" }}>{o.customerEmail}</small>
                  </td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td>{formatJMD(o.total)}</td>
                  <td>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </td>
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td>{o.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
