import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!purchaseOrder) notFound();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>{purchaseOrder.poNumber}</h1>
          <p>Supplier order for {purchaseOrder.vendorName}</p>
        </div>
      </div>

      <div className="admin-card">
        <p>
          Status: {purchaseOrder.status}
          <br />
          Amount: {formatJMD(purchaseOrder.total)}
          <br />
          Created: {new Date(purchaseOrder.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Line items</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Cost</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrder.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatJMD(item.unitCost)}</td>
                <td>{formatJMD(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
