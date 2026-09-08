import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  return (
    <main>
      <SiteHeader />
      <div className="page-shell">
        <div className="admin-card" style={{ maxWidth: 640, margin: "40px auto" }}>
          <h2 style={{ marginTop: 0 }}>
            {order.paymentStatus === "PAID" ? "Thank you — order confirmed!" : "Order received"}
          </h2>
          <p style={{ color: "#666" }}>
            Order <strong>{order.orderNumber}</strong> for {order.customerName} (
            {order.customerEmail})
          </p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.product.name} ({item.color}/{item.size})
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatJMD(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cart-total-row" style={{ marginTop: 16 }}>
            <span>Total</span>
            <span>{formatJMD(order.total)}</span>
          </div>
          <p style={{ marginTop: 20 }}>
            Payment status: <strong>{order.paymentStatus}</strong> · Order status:{" "}
            <strong>{order.status}</strong>
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
