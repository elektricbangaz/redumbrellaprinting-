import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminReceivablesPage() {
  const orders = await prisma.order.findMany({ where: { paymentStatus: { in: ["UNPAID", "PENDING", "FAILED"] } }, include: { items: true }, orderBy: { createdAt: "asc" } });
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  return <>
    <div className="admin-header"><div><h1>Receivables</h1><p>Orders that still show an outstanding payment state.</p></div></div>
    <div className="admin-kpi-strip"><div><small>Outstanding order value</small><strong>{formatJMD(total)}</strong></div><div><small>Orders needing follow-up</small><strong>{orders.length}</strong></div></div>
    <div className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Order date</th><th>Payment state</th><th>Outstanding</th><th>Details</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.customerName}<small>{order.customerEmail}</small></td><td>{order.createdAt.toLocaleDateString()}</td><td>{order.paymentStatus}</td><td>{formatJMD(order.total)}</td><td><Link href={`/orders/${order.id}`}>Open order</Link></td></tr>)}
    </tbody></table>{orders.length === 0 && <div className="admin-empty">No orders are currently awaiting payment.</div>}</div></div>
    <p className="admin-data-note">The current system has no invoice due dates or partial-payment ledger; outstanding values here are the full totals of unpaid orders, not accounting-aged receivables.</p>
  </>;
}
