import Link from "next/link";
import { AlertTriangle, CheckCircle2, Factory, PackageCheck, Printer, Scissors, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductionActions } from "@/components/admin/ProductionActions";

export const dynamic = "force-dynamic";

function itemLabel(job: any) {
  return job.order.items.map((item: any) => item.product.name + " (" + item.size + ")").join(", ") || "Print job";
}
function qty(job: any) { return job.order.items.reduce((sum: number, item: any) => sum + item.quantity, 0); }
function overdue(job: any) { return Boolean(job.dueDate && job.dueDate < new Date() && !["READY","COMPLETED","CANCELLED"].includes(job.stage)); }

const lanes = [
  { key: "PRE_PRESS", title: "Pre-Press", sub: "File prep, imposition, proofing", icon: Factory },
  { key: "PRINTING", title: "Printing", sub: "On press production", icon: Printer },
  { key: "FINISHING", title: "Finishing", sub: "Cutting, folding, binding", icon: Scissors },
  { key: "QUALITY_CHECK", title: "Quality Check", sub: "Inspection & packing", icon: ShieldCheck },
  { key: "READY", title: "Ready", sub: "Completed — ready for pickup", icon: PackageCheck },
] as const;

function inLane(job: any, key: string) {
  if (key === "QUALITY_CHECK") return job.stage === "QUALITY_CHECK";
  if (key === "READY") return job.stage === "READY";
  if (job.stage === "APPROVED" || job.stage === "QUEUED") return key === "PRE_PRESS";
  return job.stage === "IN_PROGRESS" && (job.productionPhase || "PRE_PRESS") === key;
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const sp = await searchParams;
  const jobs = await prisma.workOrder.findMany({
    where: { stage: { notIn: ["COMPLETED", "CANCELLED"] } },
    include: {
      order: { include: { items: { include: { product: true, design: true } } } },
      events: { orderBy: { createdAt: "desc" }, take: 8 },
      sessions: { where: { active: true }, include: { staff: true }, orderBy: { startedAt: "desc" }, take: 1 },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });
  const selected = jobs.find((j) => j.id === sp.job) ?? jobs.find((j) => j.stage === "IN_PROGRESS") ?? jobs[0] ?? null;
  const counts = {
    floor: jobs.filter((j) => ["IN_PROGRESS","QUALITY_CHECK"].includes(j.stage)).length,
    printing: jobs.filter((j) => j.stage === "IN_PROGRESS" && j.productionPhase === "PRINTING").length,
    finishing: jobs.filter((j) => j.stage === "IN_PROGRESS" && j.productionPhase === "FINISHING").length,
    ready: jobs.filter((j) => j.stage === "READY").length,
    rush: jobs.filter((j) => ["URGENT","HIGH"].includes(j.priority)).length,
    overdue: jobs.filter(overdue).length,
  };

  return <div className="ru-page ru-jobs-page">
    <div className="ru-page-heading"><div><h1>Jobs / Production Board</h1><p>Track live production, route work, and manage floor status.</p></div><div className="ru-page-tools"><select><option>All Locations</option></select><input placeholder="Search jobs, customer, or product..."/><button>Filters</button><button>Board View</button></div></div>

    <section className="ru-stat-strip">
      <article><Factory/><span><small>On Floor</small><strong>{counts.floor}</strong><em>jobs in production</em></span></article>
      <article><Printer/><span><small>Printing</small><strong>{counts.printing}</strong><em>on press now</em></span></article>
      <article><Scissors/><span><small>Finishing</small><strong>{counts.finishing}</strong><em>in finishing</em></span></article>
      <article><PackageCheck/><span><small>Ready for Pickup</small><strong>{counts.ready}</strong><em>awaiting customer</em></span></article>
      <article><AlertTriangle/><span><small>Rush Jobs</small><strong>{counts.rush}</strong><em>high priority</em></span></article>
      <article className="danger"><AlertTriangle/><span><small>Overdue</small><strong>{counts.overdue}</strong><em>past due date</em></span></article>
    </section>

    <div className={"ru-board-layout" + (selected ? " has-detail" : "")}>
      <section className="ru-kanban">
        {lanes.map((lane) => {
          const laneJobs = jobs.filter((job) => inLane(job, lane.key));
          const Icon = lane.icon;
          return <div className={"ru-lane lane-" + lane.key.toLowerCase()} key={lane.key}>
            <header><div><Icon size={16}/><span><strong>{lane.title}</strong><small>{lane.sub}</small></span></div><b>{laneJobs.length}</b></header>
            <div className="ru-lane-body">
              {laneJobs.map((job) => {
                const active = selected?.id === job.id;
                const last = job.sessions[0]?.staff.name || job.lastWorkedBy || job.assignedTo || "Unassigned";
                return <Link href={"/jobs?job=" + job.id} className={"ru-job-card" + (active ? " selected" : "")} key={job.id}>
                  <div className="ru-card-top"><strong>{job.workOrderNumber}</strong><span className={"ru-priority p-" + job.priority.toLowerCase()}>{job.priority === "URGENT" ? "Rush" : job.priority}</span></div>
                  <b>{job.order.customerName}</b>
                  <p>{itemLabel(job)}</p>
                  <p>{qty(job).toLocaleString()} pcs</p>
                  <div className="ru-card-meta"><span>{job.dueDate ? job.dueDate.toLocaleDateString("en-JM",{month:"short",day:"numeric",year:"numeric"}) : "No due date"}{overdue(job) ? " · Overdue" : ""}</span><span>{last}</span></div>
                  {job.progress > 0 && <div className="ru-mini-progress"><i style={{width: job.progress + "%"}}/><small>{job.progress}%</small></div>}
                </Link>;
              })}
              {!laneJobs.length && <p className="ru-empty-lane">No jobs</p>}
            </div>
          </div>;
        })}
      </section>

      {selected && <aside className="ru-job-detail">
        <header><div><strong>Job Details</strong><span>{selected.workOrderNumber}</span></div><span className={"ru-status-pill " + selected.stage.toLowerCase()}>{selected.productionPhase.replaceAll("_"," ")}</span></header>
        <div className="ru-job-detail-title"><div><h2>{selected.order.customerName}</h2><p>{itemLabel(selected)}</p></div><span className={"ru-priority p-" + selected.priority.toLowerCase()}>{selected.priority === "URGENT" ? "Rush" : selected.priority}</span></div>
        <nav className="ru-detail-tabs"><b>Overview</b><span>Materials</span><span>Artwork</span><span>Checklist</span><span>Timeline</span></nav>

        <div className="ru-detail-grid">
          <section>
            <dl>
              <div><dt>Quantity</dt><dd>{qty(selected).toLocaleString()} pcs</dd></div>
              <div><dt>Due Date</dt><dd className={overdue(selected) ? "danger-text" : ""}>{selected.dueDate ? selected.dueDate.toLocaleString("en-JM",{weekday:"short",month:"short",day:"numeric",year:"numeric"}) : "Not scheduled"}</dd></div>
              <div><dt>Customer</dt><dd>{selected.order.customerName}</dd></div>
              <div><dt>Assigned Operator</dt><dd>{selected.sessions[0]?.staff.name || selected.lastWorkedBy || selected.assignedTo || "Unassigned"}</dd></div>
              <div><dt>Machine / Station</dt><dd>{selected.machine || selected.productionMethod || "Not assigned"}</dd></div>
              <div><dt>Current Stage</dt><dd>{selected.productionPhase.replaceAll("_"," ")}</dd></div>
            </dl>
          </section>
          <section>
            <div className="ru-detail-progress"><span>Production Progress</span><strong>{selected.progress}%</strong><div><i style={{width:selected.progress + "%"}}/></div></div>
            <div className="ru-detail-block"><h3>Materials</h3><p>{selected.productionMethod || "Production method not specified"}</p><p>{selected.placement || "Placement not specified"}</p></div>
            <div className="ru-detail-block"><h3>Artwork / Proof</h3><p><CheckCircle2 size={14}/> {selected.order.items.some((i) => i.designId) ? "Artwork attached" : "No artwork attached"}</p></div>
            <div className="ru-detail-block"><h3>Production Checklist</h3><p><CheckCircle2 size={14}/> Order approved / queued</p><p><CheckCircle2 size={14}/> Stock / material check</p><p>{selected.stage === "QUALITY_CHECK" || selected.stage === "READY" ? <CheckCircle2 size={14}/> : <span className="ru-open-circle"/>} Quality check</p></div>
          </section>
        </div>

        <div className="ru-job-notes"><h3>Internal Notes</h3><p>{selected.notes || selected.events[0]?.note || "No production notes yet."}</p></div>
        <ProductionActions id={selected.id} progress={selected.progress} phase={selected.productionPhase} compact />
      </aside>}
    </div>

    <section className="ru-bottom-panels">
      <article><header><AlertTriangle size={15}/> Urgent / At Risk Jobs <Link href="/job-queue?stage=OVERDUE">View All</Link></header><table><tbody>{jobs.filter((j)=>overdue(j)||j.priority==="URGENT").slice(0,4).map((j)=><tr key={j.id}><td>{j.workOrderNumber}</td><td>{j.order.customerName}</td><td>{itemLabel(j)}</td><td>{j.dueDate?.toLocaleDateString() || "—"}</td><td>{j.stage.replaceAll("_"," ")}</td></tr>)}</tbody></table></article>
      <article><header><Printer size={15}/> Machine Queue <Link href="/job-queue">View All</Link></header><table><tbody>{jobs.filter((j)=>j.stage==="IN_PROGRESS").slice(0,4).map((j,i)=><tr key={j.id}><td>{i+1}</td><td>{j.workOrderNumber}</td><td>{j.order.customerName}</td><td>{j.machine || j.productionMethod || "Unassigned"}</td><td>{j.progress}%</td></tr>)}</tbody></table></article>
      <article><header><PackageCheck size={15}/> Today&apos;s Pickups & Deliveries <Link href="/pickup-delivery">View All</Link></header><table><tbody>{jobs.filter((j)=>j.stage==="READY").slice(0,4).map((j)=><tr key={j.id}><td>{j.order.customerName}</td><td>{j.workOrderNumber}</td><td>Pickup</td><td>Ready</td></tr>)}</tbody></table></article>
    </section>
  </div>;
}
