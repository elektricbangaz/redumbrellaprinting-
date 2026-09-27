import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true, design: true } } },
  });

  if (!order) notFound();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>{order.orderNumber}</h1>
          <p>Commercial quote review for {order.customerName}</p>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Customer brief</h3>
          <p>
            Customer: {order.customerName}
            <br />
            Email: {order.customerEmail}
            <br />
            Phone: {order.customerPhone ?? "—"}
          </p>
          <h3>Project notes</h3>
          <p>{order.notes || "No project notes added."}</p>
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Quote summary</h3>
          <p>
            Total: <strong>{formatJMD(order.total)}</strong>
            <br />
            Payment: {order.paymentStatus}
            <br />
            Production: {order.status.replaceAll("_", " ")}
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Items</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Size</th>
              <th>Color</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>{item.quantity}</td>
                <td>{item.size}</td>
                <td>{item.color}</td>
                <td>{formatJMD(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
