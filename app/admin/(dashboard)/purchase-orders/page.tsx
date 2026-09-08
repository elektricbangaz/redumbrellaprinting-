import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { PurchaseOrderStatusSelect } from "@/components/admin/PurchaseOrderStatusSelect";

export default async function AdminPurchaseOrdersPage() {
  const pos = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Purchase Orders</h1>
          <p>Manage supplier POs for blanks, ink, and materials.</p>
        </div>
        <Link className="button button-red" href="/admin/purchase-orders/new">
          + New Purchase Order
        </Link>
      </div>
      <div className="admin-card">
        {pos.length === 0 ? (
          <div className="admin-empty">No purchase orders yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Vendor</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id}>
                  <td>{po.poNumber}</td>
                  <td>{po.vendorName}</td>
                  <td>{formatJMD(po.total)}</td>
                  <td>
                    <PurchaseOrderStatusSelect id={po.id} status={po.status} />
                  </td>
                  <td>{po.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
