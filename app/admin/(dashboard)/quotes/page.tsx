import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
    take: 20,
  });

  const quoteCandidates = orders.filter((order) => {
    const hasComplexProduct = order.items.some((item) => item.product.slug !== "standard-t-shirt" && item.product.slug !== "polo-shirt");
    return hasComplexProduct || order.total === 0 || order.notes?.toLowerCase().includes("quote");
  });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Quote Pipeline</h1>
          <p>Commercial work, custom builds, and bulk jobs pending review.</p>
        </div>
      </div>

      <div className="admin-card">
        {quoteCandidates.length === 0 ? (
          <div className="admin-empty">No quote-driven jobs in the current queue.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Job Type</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quoteCandidates.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/quotes/${order.id}`}>{order.orderNumber}</Link>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.items.map((item) => item.product.name).join(", ") || "Custom job"}</td>
                  <td>{formatJMD(order.total)}</td>
                  <td>{order.status.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
