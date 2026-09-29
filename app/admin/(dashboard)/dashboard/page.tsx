import Link from "next/link";
import { ArrowRight, Boxes, CalendarDays, Check, ChevronDown, CircleDollarSign, ClipboardCheck, Clock3, CreditCard, Factory, FileText, Megaphone, PackageCheck, ReceiptText, ShoppingBag, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/badges";

export const dynamic = "force-dynamic";

function moneyShort(value: number) {
  return new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD", maximumFractionDigits: 0 }).format(value / 100);
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);
  periodStart.setDate(periodStart.getDate() - 6);
  const [orders, recentOrders, workOrders, completedCount, inProductionCount, readyCount, reviewCount, periodPaid, outstandingOrders, topPaidOrders] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: periodStart } }, select: { createdAt: true, total: true, paymentStatus: true } }),
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.workOrder.findMany({ include: { order: { select: { orderNumber: true, customerName: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.workOrder.count({ where: { stage: "COMPLETED" } }),
    prisma.workOrder.count({ where: { stage: { in: ["IN_PROGRESS", "QUALITY_CHECK"] } } }),
    prisma.workOrder.count({ where: { stage: "READY" } }),
    prisma.workOrder.count({ where: { stage: { in: ["SUBMITTED", "REVIEW", "NEEDS_CUSTOMER_APPROVAL"] } } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID", createdAt: { gte: periodStart } }, _sum: { total: true } }),
    prisma.order.findMany({ where: { paymentStatus: { in: ["UNPAID", "PENDING", "FAILED"] } }, orderBy: { createdAt: "asc" }, take: 5 }),
    prisma.order.findMany({ where: { paymentStatus: "PAID" }, select: { customerName: true, total: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const totalPaid = await prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } });
  const newCount = await prisma.order.count({ where: { createdAt: { gte: periodStart } } });
  const outstandingTotal = outstandingOrders.reduce((sum, order) => sum + order.total, 0);
  const paidThisMonth = periodPaid._sum.total ?? 0;
  const customerRevenue = new Map<string, number>();
  for (const order of topPaidOrders) customerRevenue.set(order.customerName, (customerRevenue.get(order.customerName) ?? 0) + order.total);
  const topCustomers = [...customerRevenue.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(periodStart);
    date.setDate(periodStart.getDate() + index);
    const value = orders.filter((order) => order.paymentStatus === "PAID" && order.createdAt.toDateString() === date.toDateString()).reduce((sum, order) => sum + order.total, 0);
    return { date, value };
  });
  const maxDay = Math.max(...days.map((day) => day.value), 1);
  const chartPoints = days.map((day, index) => `${32 + index * 86},${126 - (day.value / maxDay) * 101}`).join(" ");
  const areaPoints = `32,130 ${chartPoints} 548,130`;
  const stageCounts = await prisma.workOrder.groupBy({ by: ["stage"], _count: { _all: true } });
  const stageCount = new Map(stageCounts.map((stage) => [stage.stage, stage._count._all]));
  const kpis = [
    { label: "Total Revenue", value: formatJMD(totalPaid._sum.total ?? 0), trend: "Paid orders", icon: CircleDollarSign, tone: "red" },
    { label: "New Orders", value: newCount, trend: "Last 7 days", icon: ShoppingBag, tone: "green" },
    { label: "In Production", value: inProductionCount, trend: "Active jobs", icon: Factory, tone: "amber" },
    { label: "Ready for Pickup", value: readyCount, trend: "Awaiting handoff", icon: PackageCheck, tone: "blue" },
    { label: "Completed Orders", value: completedCount, trend: "All time", icon: Check, tone: "purple" },
  ];
  const dateRange = `${days[0].date.toLocaleDateString("en-JM", { month: "short", day: "numeric" })} – ${days[6].date.toLocaleDateString("en-JM", { month: "short", day: "numeric" })}`;
  const progressStages = [
    { label: "Needs Review", count: reviewCount, icon: Clock3, tone: "grey" },
    { label: "Queued", count: stageCount.get("QUEUED") ?? 0, icon: ShoppingBag, tone: "grey" },
    { label: "In Production", count: stageCount.get("IN_PROGRESS") ?? 0, icon: Factory, tone: "blue" },
    { label: "Quality Check", count: stageCount.get("QUALITY_CHECK") ?? 0, icon: ClipboardCheck, tone: "amber" },
    { label: "Ready for Pickup", count: readyCount, icon: PackageCheck, tone: "green" },
    { label: "Completed", count: completedCount, icon: Check, tone: "purple" },
  ];

  return <div className="client-dashboard">
    <div className="client-dashboard-heading"><div><h1>Dashboard</h1><p>Welcome back, Red Umbrella Team.</p></div><div className="client-heading-actions"><span className="client-date-range"><CalendarDays size={15}/>{dateRange}</span><Link className="client-notifications" href="/work-orders" aria-label={`${inProductionCount} active production jobs`}><Factory size={17}/><i>{inProductionCount}</i></Link><Link href="/orders" className="client-new-order"><ShoppingBag size={15}/>Order Desk<ChevronDown size={13}/></Link></div></div>

    <section className="client-kpis">{kpis.map(({ label, value, trend, icon: Icon, tone }) => <article className="client-kpi" key={label}><div><span>{label}</span><strong>{value}</strong><small>{trend}</small></div><i className={tone}><Icon size={19}/></i></article>)}</section>

    <section className="client-dashboard-row client-dashboard-row-top">
      <article className="client-widget client-sales-widget"><div className="client-widget-heading"><h2>Sales Overview</h2><span className="client-range-select">Last 7 days <ChevronDown size={13}/></span></div><strong className="client-sales-total">{moneyShort(paidThisMonth)}</strong><small className="client-sales-caption">Paid order revenue · {dateRange}</small><div className="client-chart"><div className="client-chart-y"><span>{moneyShort(maxDay)}</span><span>{moneyShort(maxDay * .66)}</span><span>{moneyShort(maxDay * .33)}</span><span>JMD 0</span></div><svg viewBox="0 0 580 150" role="img" aria-label="Paid revenue by day for the last seven days" preserveAspectRatio="none"><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d20d14" stopOpacity=".15"/><stop offset="1" stopColor="#d20d14" stopOpacity="0"/></linearGradient></defs><path d={`M ${areaPoints.replaceAll(" ", " L ")} Z`} fill="url(#revenue-fill)"/><polyline points={chartPoints} fill="none" stroke="#d20d14" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>{days.map((day, i) => <g key={day.date.toISOString()}><circle cx={32 + i * 86} cy={126 - (day.value / maxDay) * 101} r="3.5" fill="#fff" stroke="#d20d14" strokeWidth="2"/><text x={32 + i * 86} y="148" textAnchor="middle">{day.date.toLocaleDateString("en-JM", { weekday: "short" })}</text></g>)}</svg></div></article>

      <article className="client-widget client-receivables-widget"><div className="client-widget-heading"><h2>Receivables Summary</h2><Link href="/receivables">View All</Link></div><div className="client-outstanding"><span><CreditCard size={18}/></span><div><small>Total Outstanding</small><strong>{formatJMD(outstandingTotal)}</strong></div></div><div className="client-receivable-cards"><div><small>Unpaid orders</small><strong>{formatJMD(outstandingOrders.filter((o) => o.paymentStatus === "UNPAID").reduce((s, o) => s + o.total, 0))}</strong></div><div><small>Pending payment</small><strong>{formatJMD(outstandingOrders.filter((o) => o.paymentStatus === "PENDING").reduce((s, o) => s + o.total, 0))}</strong></div><div><small>Paid this week</small><strong>{formatJMD(paidThisMonth)}</strong></div></div></article>

      <article className="client-widget client-customers-widget"><div className="client-widget-heading"><h2>Top Customers <small>(Revenue)</small></h2><Link href="/customers">View All</Link></div>{topCustomers.length ? topCustomers.map(([name, revenue], index) => <div className="client-top-customer" key={name}><i className={`client-customer-initial client-initial-${index}`}>{name.slice(0, 1).toUpperCase()}</i><strong>{name}</strong><span>{formatJMD(revenue)}</span></div>) : <div className="admin-panel-empty">Paid customer orders will appear here.</div>}</article>
    </section>

    <section className="client-dashboard-row client-dashboard-row-tables">
      <article className="client-widget"><div className="client-widget-heading"><h2>Recent Orders</h2><Link href="/orders">View All</Link></div><div className="client-table-wrap"><table className="admin-table client-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><td><Link href={`/orders/${order.id}`}>{order.orderNumber}</Link></td><td>{order.customerName}</td><td>{order.items.reduce((n, item) => n + item.quantity, 0)}</td><td>{formatJMD(order.total)}</td><td><OrderStatusBadge status={order.status}/></td><td>{order.createdAt.toLocaleDateString()}</td></tr>)}</tbody></table>{recentOrders.length === 0 && <div className="admin-empty">No orders recorded yet.</div>}</div></article>
      <article className="client-widget"><div className="client-widget-heading"><h2>Outstanding Orders</h2><Link href="/receivables">View All</Link></div><div className="client-table-wrap"><table className="admin-table client-table"><thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Action</th></tr></thead><tbody>{outstandingOrders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.customerName}</td><td>{formatJMD(order.total)}</td><td><PaymentStatusBadge status={order.paymentStatus}/></td><td><Link href={`/orders/${order.id}`}>Open</Link></td></tr>)}</tbody></table>{outstandingOrders.length === 0 && <div className="admin-empty">No unpaid orders.</div>}</div></article>
    </section>

    <section className="client-dashboard-row client-dashboard-row-bottom">
      <article className="client-widget client-production-widget"><div className="client-widget-heading"><h2>Production Status</h2><Link href="/work-orders">Open production</Link></div><div className="client-production-flow">{progressStages.map(({ label, count, icon: Icon, tone }, index) => <div className="client-production-step" key={label}><span className={tone}><Icon size={17}/></span><strong>{label}</strong><small>{count} {count === 1 ? "job" : "jobs"}</small>{index < progressStages.length - 1 && <i className="client-step-line"/>}</div>)}</div></article>
      <article className="client-widget client-quick-widget"><div className="client-widget-heading"><h2>Quick Actions</h2></div><div className="client-quick-actions"><Link href="/orders"><ShoppingBag/><span>Order Desk</span></Link><Link href="/quotes"><FileText/><span>Review Quotes</span></Link><Link href="/broadcasts"><Megaphone/><span>Send Broadcast</span></Link><Link href="/purchase-orders/new"><Boxes/><span>New PO</span></Link><Link href="/customers"><Users/><span>Customers</span></Link></div></article>
    </section>
    <p className="client-dashboard-footnote"><ReceiptText size={13}/> Dashboard totals are calculated from current order/payment records; invoice aging and partial-payment accounting are not yet available.</p>
  </div>;
}
