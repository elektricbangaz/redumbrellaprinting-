import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { PaymentStatusBadge } from "@/components/admin/badges";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const orders = await prisma.order.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const captured = orders.filter((order) => order.paymentStatus === "PAID").reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => order.paymentStatus === "PENDING").reduce((sum, order) => sum + order.total, 0);
  return <>
    <div className="admin-header"><div><h1>Payments</h1><p>Payment status and provider references recorded against customer orders.</p></div></div>
    <div className="admin-kpi-strip"><div><small>Captured in recent orders</small><strong>{formatJMD(captured)}</strong></div><div><small>Pending payment</small><strong>{formatJMD(pending)}</strong></div><div><small>Orders reviewed</small><strong>{orders.length}</strong></div></div>
    <div className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Provider</th><th>Reference</th><th>Amount</th><th>Status</th><th>Updated</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.customerName}<small>{order.customerEmail}</small></td><td>{order.paymentProvider ?? "—"}</td><td>{order.paymentReference ?? "—"}</td><td>{formatJMD(order.total)}</td><td><PaymentStatusBadge status={order.paymentStatus} /></td><td>{order.updatedAt.toLocaleDateString()}</td></tr>)}
    </tbody></table>{orders.length === 0 && <div className="admin-empty">Payments appear here when customer orders are placed.</div>}</div></div>
    <p className="admin-data-note">Payments are currently represented by each order’s payment state. A separate payment ledger and reconciliation workflow are not yet implemented.</p>
  </>;
}
