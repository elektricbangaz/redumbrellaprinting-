import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkOrderControls } from "@/components/admin/WorkOrderControls";

export const dynamic = "force-dynamic";

const lanes = [
  { title: "Intake & review", stages: ["SUBMITTED", "REVIEW", "NEEDS_CUSTOMER_APPROVAL"], tone: "intake" },
  { title: "Approved / queued", stages: ["APPROVED", "QUEUED"], tone: "approved" },
  { title: "In production", stages: ["IN_PROGRESS"], tone: "production" },
  { title: "Quality check", stages: ["QUALITY_CHECK"], tone: "quality" },
  { title: "Ready for handoff", stages: ["READY"], tone: "ready" },
  { title: "Completed", stages: ["COMPLETED"], tone: "complete" },
  { title: "Exceptions", stages: ["ON_HOLD", "CANCELLED"], tone: "exception" },
];

const stageLabels: Record<string, string> = {
  SUBMITTED: "Submitted", REVIEW: "Under review", NEEDS_CUSTOMER_APPROVAL: "Needs customer approval",
  APPROVED: "Approved", QUEUED: "Queued", IN_PROGRESS: "In production",
  QUALITY_CHECK: "Quality check", READY: "Ready for pickup", COMPLETED: "Completed",
  ON_HOLD: "On hold", CANCELLED: "Cancelled",
};

export default async function AdminWorkOrdersPage() {
  const workOrders = await prisma.workOrder.findMany({
    include: {
      order: { include: { items: { include: { product: true, design: true } } } },
      events: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  const reviewCount = workOrders.filter((job) => ["SUBMITTED", "REVIEW", "NEEDS_CUSTOMER_APPROVAL"].includes(job.stage)).length;
  const activeCount = workOrders.filter((job) => ["IN_PROGRESS", "QUALITY_CHECK"].includes(job.stage)).length;
  const dueCount = workOrders.filter((job) => job.dueDate && job.dueDate < new Date() && !["COMPLETED", "CANCELLED"].includes(job.stage)).length;

  return <>
    <div className="admin-header">
      <div><h1>Production job queue</h1><p>One live queue from customer order through review, production, quality check, and handoff. Stage changes and notes are recorded in job history.</p></div>
      <Link href="/orders" className="button button-outline">View order desk</Link>
    </div>
    <div className="admin-queue-summary" aria-label="Production queue summary">
      <div><small>All jobs</small><strong>{workOrders.length}</strong></div>
      <div><small>Awaiting review</small><strong>{reviewCount}</strong></div>
      <div><small>On production floor</small><strong>{activeCount}</strong></div>
      <div className={dueCount ? "overdue" : ""}><small>Overdue / due date passed</small><strong>{dueCount}</strong></div>
    </div>

    <div className="job-queue-board" aria-label="Production job workflow">
      {lanes.map((lane) => {
        const jobs = workOrders.filter((job) => lane.stages.includes(job.stage));
        return <section className={`job-queue-lane ${lane.tone}`} key={lane.title}>
          <header><h2>{lane.title}</h2><span>{jobs.length}</span></header>
          <div className="job-queue-lane-body">
            {jobs.map((job) => {
              const totalItems = job.order.items.reduce((sum, item) => sum + item.quantity, 0);
              const isOverdue = Boolean(job.dueDate && job.dueDate < new Date() && !["COMPLETED", "CANCELLED"].includes(job.stage));
              return <article className="job-queue-card" key={job.id}>
                <div className="job-card-topline"><strong>{job.workOrderNumber}</strong><span className={`job-priority ${job.priority.toLowerCase()}`}>{job.priority}</span></div>
                <Link className="job-order-number" href={`/orders/${job.orderId}`}>{job.order.orderNumber}</Link>
                <strong className="job-customer-name">{job.order.customerName}</strong>
                <span className="job-item-summary">{job.order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(" · ") || "No order items"}</span>
                <div className="job-card-facts">
                  <span><b>Payment</b><i className={job.order.paymentStatus === "PAID" ? "paid" : "unpaid"}>{job.order.paymentStatus.replaceAll("_", " ")}</i></span>
                  <span><b>Method</b><i>{job.productionMethod || "Not specified"}</i></span>
                  <span><b>Placement</b><i>{job.placement || "Not specified"}</i></span>
                  <span><b>Assigned</b><i>{job.assignedTo || "Unassigned"}</i></span>
                  <span><b>Due</b><i className={isOverdue ? "overdue-text" : ""}>{job.dueDate ? job.dueDate.toLocaleDateString() : "Not scheduled"}{isOverdue ? " · overdue" : ""}</i></span>
                  <span><b>Items</b><i>{totalItems}</i></span>
                </div>
                {job.blockedReason && <p className="job-hold-reason"><b>Exception:</b> {job.blockedReason}</p>}
                <WorkOrderControls
                  id={job.id}
                  stage={job.stage}
                  priority={job.priority}
                  assignedTo={job.assignedTo}
                  dueDate={job.dueDate?.toISOString().slice(0, 10) ?? null}
                  productionMethod={job.productionMethod}
                  placement={job.placement}
                  blockedReason={job.blockedReason}
                  paymentStatus={job.order.paymentStatus}
                />
                {job.events.length > 0 && <details className="job-history"><summary>Recent history ({job.events.length})</summary><ol>{job.events.map((event) => <li key={event.id}><span>{stageLabels[event.toStage] ?? event.toStage.replaceAll("_", " ")}</span><small>{event.note || "Stage updated"}</small><small>{event.changedBy || "System"} · {event.createdAt.toLocaleString()}</small></li>)}</ol></details>}
              </article>;
            })}
            {jobs.length === 0 && <p className="job-queue-empty">No jobs in this lane.</p>}
          </div>
        </section>;
      })}
    </div>
    <p className="admin-data-note">This queue currently starts from paid/unpaid storefront orders. Quote requests, separately submitted designs, invoices, and POS jobs are not yet converted into work orders.</p>
  </>;
}