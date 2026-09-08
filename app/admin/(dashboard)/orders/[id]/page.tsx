import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { PaymentStatusBadge } from "@/components/admin/badges";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true, design: true } }, workOrders: true },
  });
  if (!order) notFound();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>{order.orderNumber}</h1>
          <p>
            Placed {order.createdAt.toLocaleString()} · Work order{" "}
            {order.workOrders[0]?.workOrderNumber ?? "—"}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Customer</h3>
          <p>
            {order.customerName}
            <br />
            {order.customerEmail}
            <br />
            {order.customerPhone || "No phone provided"}
          </p>
          <h3>Shipping</h3>
          <p>{order.shippingAddress || "No address provided (pickup)"}</p>
          {order.notes && (
            <>
              <h3>Notes</h3>
              <p>{order.notes}</p>
            </>
          )}
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Payment</h3>
          <p>
            Provider: <strong>{order.paymentProvider ?? "—"}</strong>
            <br />
            Status: <PaymentStatusBadge status={order.paymentStatus} />
            <br />
            Reference: {order.paymentReference ?? "—"}
          </p>
          <h3>Total</h3>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--red)" }}>
            {formatJMD(order.total)}
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Items</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Color/Size</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line Total</th>
              <th>Custom Design</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>
                  {item.color} / {item.size}
                </td>
                <td>{item.quantity}</td>
                <td>{formatJMD(item.unitPrice)}</td>
                <td>{formatJMD(item.lineTotal)}</td>
                <td>{item.design ? "Yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
