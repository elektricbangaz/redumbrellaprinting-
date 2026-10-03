import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { PurchaseOrderStatusSelect } from "@/components/admin/PurchaseOrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminPurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const purchaseOrder = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { include: { inventoryItem: true } } } });
  if (!purchaseOrder) notFound();
  return <div className="ru-page">
    <div className="admin-header"><div><h1>{purchaseOrder.poNumber}</h1><p>Supplier order for {purchaseOrder.vendorName}</p></div><PurchaseOrderStatusSelect id={purchaseOrder.id} status={purchaseOrder.status}/></div>
    <div className="admin-kpi-strip"><div><small>Status</small><strong>{purchaseOrder.status}</strong></div><div><small>Total</small><strong>{formatJMD(purchaseOrder.total)}</strong></div><div><small>Created</small><strong>{purchaseOrder.createdAt.toLocaleDateString()}</strong></div><div><small>Received</small><strong>{purchaseOrder.receivedAt?purchaseOrder.receivedAt.toLocaleDateString():"—"}</strong></div></div>
    <section className="admin-card"><h3>Line items</h3><p className="admin-data-note">When this PO is marked RECEIVED, linked inventory lines are posted into stock exactly once.</p><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Description</th><th>Inventory link</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th></tr></thead><tbody>{purchaseOrder.items.map((item)=><tr key={item.id}><td>{item.description}</td><td>{item.inventoryItem?`${item.inventoryItem.sku} · ${item.inventoryItem.name}`:"Non-stock / unlinked"}</td><td>{item.quantity}</td><td>{formatJMD(item.unitCost)}</td><td>{formatJMD(item.lineTotal)}</td></tr>)}</tbody></table></div></section>
    {purchaseOrder.receivedAt&&<p className="admin-data-note">Inventory receipt posted {purchaseOrder.receivedAt.toLocaleString()} by {purchaseOrder.receivedBy||"Admin"}.</p>}
  </div>;
}
