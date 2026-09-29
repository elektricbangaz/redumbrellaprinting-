import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [orderCount, paid, unpaid, workOrders, customers] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { paymentStatus: { in: ["UNPAID", "PENDING", "FAILED"] } }, _sum: { total: true }, _count: true }),
    prisma.workOrder.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.customer.count(),
  ]);
  const stageCounts = new Map(workOrders.map((row) => [row.stage, row._count._all]));
  return <>
    <div className="admin-header"><div><h1>Reports</h1><p>Current operational snapshot from saved orders and work orders.</p></div></div>
    <div className="admin-kpi-strip"><div><small>All orders</small><strong>{orderCount}</strong></div><div><small>Paid order value</small><strong>{formatJMD(paid._sum.total ?? 0)}</strong></div><div><small>Outstanding value</small><strong>{formatJMD(unpaid._sum.total ?? 0)}</strong></div><div><small>Customers</small><strong>{customers}</strong></div></div>
    <div className="admin-grid-2"><section className="admin-card"><h2>Production by stage</h2><div className="admin-report-stages">{[["QUEUED", "Queued"], ["IN_PROGRESS", "In production"], ["QUALITY_CHECK", "Quality check"], ["COMPLETED", "Completed"]].map(([key, label]) => <div key={key}><span>{label}</span><strong>{stageCounts.get(key as "QUEUED" | "IN_PROGRESS" | "QUALITY_CHECK" | "COMPLETED") ?? 0}</strong></div>)}</div><Link href="/work-orders">Open production board →</Link></section><section className="admin-card"><h2>Sales and payments</h2><p>{paid._count} orders marked paid totaling <strong>{formatJMD(paid._sum.total ?? 0)}</strong>.</p><p>{unpaid._count} unpaid or pending orders totaling <strong>{formatJMD(unpaid._sum.total ?? 0)}</strong>.</p><Link href="/payments">Review payment records →</Link></section></div>
    <p className="admin-data-note">This report uses current order totals and statuses; it is not a historical accounting report and does not include costs, tax, refunds, or inventory valuation.</p>
  </>;
}
