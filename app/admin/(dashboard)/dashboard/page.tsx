import Link from "next/link";
import { AlertTriangle, Clock3, Factory, PackageCheck, ShoppingBag, CircleDollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

function product(job:any){return job.order.items.map((i:any)=>i.product.name).join(", ") || "Print job";}
function qty(job:any){return job.order.items.reduce((s:number,i:any)=>s+i.quantity,0);}
function overdue(job:any){return Boolean(job.dueDate && job.dueDate < new Date() && !["READY","COMPLETED","CANCELLED"].includes(job.stage));}
function lane(job:any){
  if(job.stage==="SUBMITTED" || job.stage==="REVIEW") return "NEW";
  if(job.stage==="NEEDS_CUSTOMER_APPROVAL") return "APPROVAL";
  if(job.stage==="APPROVED" || job.stage==="QUEUED") return "DESIGN";
  if(job.stage==="IN_PROGRESS" && job.productionPhase==="PRINTING") return "PRINTING";
  if(job.stage==="IN_PROGRESS" && job.productionPhase==="FINISHING") return "FINISHING";
  if(job.stage==="IN_PROGRESS") return "DESIGN";
  if(job.stage==="QUALITY_CHECK") return "FINISHING";
  if(job.stage==="READY") return "READY";
  if(job.stage==="COMPLETED") return "DELIVERED";
  return "NEW";
}
function label(job:any){
  if(job.stage==="NEEDS_CUSTOMER_APPROVAL") return "Proof Sent";
  if(job.stage==="APPROVED" || job.stage==="QUEUED") return "In Design";
  if(job.stage==="IN_PROGRESS") return job.productionPhase==="FINISHING" ? "Finishing" : job.productionPhase==="PRINTING" ? "Printing" : "Pre-Press";
  if(job.stage==="READY") return "Ready";
  if(job.stage==="COMPLETED") return "Delivered";
  return job.stage==="REVIEW" ? "Review" : "New";
}

const lanes=[
  ["NEW","New Jobs","Just received"],
  ["APPROVAL","Awaiting Approval","Waiting on customer"],
  ["DESIGN","In Design","Creating artwork"],
  ["PRINTING","Printing","On press"],
  ["FINISHING","Finishing","Cutting, folding, etc."],
  ["READY","Ready","Awaiting pickup/delivery"],
  ["DELIVERED","Delivered","Completed"],
] as const;

export default async function AdminDashboardPage(){
  const now=new Date();
  const today=new Date(now); today.setHours(0,0,0,0);
  const jobs=await prisma.workOrder.findMany({
    include:{order:{include:{items:{include:{product:true}}}}},
    orderBy:[{dueDate:"asc"},{createdAt:"desc"}],
    take:80,
  });
  const todayOrders=await prisma.order.findMany({where:{createdAt:{gte:today}},select:{total:true,paymentStatus:true}});
  const selected=jobs.find(j=>j.stage==="IN_PROGRESS") ?? jobs.find(j=>j.stage==="READY") ?? jobs[0] ?? null;
  const stats={
    today:jobs.filter(j=>j.createdAt>=today).length,
    queue:jobs.filter(j=>["APPROVED","QUEUED"].includes(j.stage)).length,
    production:jobs.filter(j=>["IN_PROGRESS","QUALITY_CHECK"].includes(j.stage)).length,
    ready:jobs.filter(j=>j.stage==="READY").length,
    overdue:jobs.filter(overdue).length,
    revenue:todayOrders.filter(o=>o.paymentStatus==="PAID").reduce((s,o)=>s+o.total,0),
  };
  const quotes=await prisma.order.findMany({
    include:{items:{include:{product:true}}},
    orderBy:{createdAt:"desc"},
    take:20,
  });
  const quoteRows=quotes.filter(order=>order.total===0 || order.notes?.toLowerCase().includes("quote") || order.items.some(i=>!["standard-t-shirt","polo-shirt"].includes(i.product.slug))).slice(0,4);
  const pickups=jobs.filter(j=>j.stage==="READY").slice(0,5);
  const urgent=jobs.filter(j=>overdue(j)||j.priority==="URGENT").slice(0,5);

  return <div className="ru-page ru-dashboard-page">
    <section className="ru-stat-strip ru-dashboard-stats">
      <article><ShoppingBag/><span><small>Total Jobs Today</small><strong>{stats.today}</strong><em>received today</em></span></article>
      <article><Clock3/><span><small>In Queue</small><strong>{stats.queue}</strong><em>waiting to start</em></span></article>
      <article><Factory/><span><small>In Production</small><strong>{stats.production}</strong><em>currently on floor</em></span></article>
      <article><PackageCheck/><span><small>Ready for Pickup</small><strong>{stats.ready}</strong><em>awaiting customer</em></span></article>
      <article className="danger"><AlertTriangle/><span><small>Overdue</small><strong>{stats.overdue}</strong><em>past due date</em></span></article>
      <article><CircleDollarSign/><span><small>Today&apos;s Revenue</small><strong>{formatJMD(stats.revenue)}</strong><em>paid orders today</em></span></article>
    </section>

    <div className="ru-page-heading ru-dashboard-heading">
      <div><h1>Job Queue / Production Board</h1><p>Drag and drop jobs to update status. Click a job to view details.</p></div>
      <div className="ru-page-tools"><select><option>All Locations</option></select><input placeholder="Search jobs in queue..."/><button>Filters</button></div>
    </div>

    <div className={"ru-board-layout ru-dashboard-board"+(selected?" has-detail":"")}>
      <section className="ru-kanban ru-kanban-seven">
        {lanes.map(([key,title,sub])=>{
          const laneJobs=jobs.filter(j=>lane(j)===key).slice(0,4);
          return <div className={"ru-lane lane-"+key.toLowerCase()} key={key}>
            <header><div><span><strong>{title}</strong><small>{sub}</small></span></div><b>{jobs.filter(j=>lane(j)===key).length}</b></header>
            <div className="ru-lane-body">
              {laneJobs.map(job=><Link href={"/jobs?job="+job.id} className={"ru-job-card"+(selected?.id===job.id?" selected":"")} key={job.id}>
                <div className="ru-card-top"><strong>{job.workOrderNumber}</strong><span className={"ru-priority p-"+job.priority.toLowerCase()}>{job.priority==="URGENT"?"Rush":job.priority}</span></div>
                <b>{job.order.customerName}</b>
                <p>{product(job)}</p><p>{qty(job).toLocaleString()} pcs</p>
                <div className="ru-card-meta"><span>{job.dueDate?job.dueDate.toLocaleDateString("en-JM",{month:"short",day:"numeric",year:"numeric"}):"No due date"}</span><span>{job.lastWorkedBy||job.assignedTo||label(job)}</span></div>
              </Link>)}
              {!laneJobs.length&&<p className="ru-empty-lane">No jobs</p>}
            </div>
          </div>;
        })}
      </section>

      {selected&&<aside className="ru-job-detail ru-dashboard-detail">
        <header><div><strong>Job Details</strong><span>{selected.workOrderNumber}</span></div><span className={"ru-status-pill s-"+selected.stage.toLowerCase()}>{label(selected)}</span></header>
        <div className="ru-job-detail-title"><div><h2>{selected.order.customerName}</h2><p>{product(selected)}</p><p>{qty(selected).toLocaleString()} pcs</p></div><span className={"ru-priority p-"+selected.priority.toLowerCase()}>{selected.priority}</span></div>
        <nav className="ru-detail-tabs"><b>Overview</b><span>Artwork</span><span>Materials</span><span>Timeline</span></nav>
        <dl>
          <div><dt>Due Date</dt><dd className={overdue(selected)?"danger-text":""}>{selected.dueDate?selected.dueDate.toLocaleDateString():"Not set"}</dd></div>
          <div><dt>Customer</dt><dd>{selected.order.customerName}</dd></div>
          <div><dt>Assigned To</dt><dd>{selected.lastWorkedBy||selected.assignedTo||"Unassigned"}</dd></div>
          <div><dt>Payment</dt><dd>{selected.order.paymentStatus}</dd></div>
          <div><dt>Current Stage</dt><dd>{label(selected)}</dd></div>
          <div><dt>Progress</dt><dd>{selected.progress}%</dd></div>
        </dl>
        <div className="ru-job-notes"><h3>Internal Notes</h3><p>{selected.notes||"No production notes yet."}</p></div>
        <div className="ru-detail-actions"><Link href={"/jobs?job="+selected.id}>Open Job</Link><Link href={"/production?job="+selected.id}>Floor Tablet</Link></div>
      </aside>}
    </div>

    <section className="ru-bottom-panels ru-dashboard-panels">
      <article><header><AlertTriangle size={15}/> Urgent / At Risk Jobs <Link href="/job-queue?stage=OVERDUE">View All</Link></header><table><tbody>{urgent.map(j=><tr key={j.id}><td>{j.workOrderNumber}</td><td>{j.order.customerName}</td><td>{product(j)}</td><td className={overdue(j)?"danger-text":""}>{j.dueDate?.toLocaleDateString()||"—"}</td><td>{label(j)}</td></tr>)}</tbody></table>{!urgent.length&&<p className="ru-panel-empty">No urgent jobs.</p>}</article>
      <article><header>Recent Quotes <Link href="/quotes">View All</Link></header><table><tbody>{quoteRows.map(o=><tr key={o.id}><td>{o.orderNumber}</td><td>{o.customerName}</td><td>{o.items.map(i=>i.product.name).join(", ")}</td><td>{formatJMD(o.total)}</td><td>{o.paymentStatus}</td></tr>)}</tbody></table>{!quoteRows.length&&<p className="ru-panel-empty">No quote-type orders yet.</p>}</article>
      <article><header><PackageCheck size={15}/> Today&apos;s Pickups & Deliveries <Link href="/pickup-delivery">View All</Link></header><table><tbody>{pickups.map(j=><tr key={j.id}><td>{j.order.customerName}</td><td>{j.workOrderNumber}</td><td>{product(j)}</td><td>Pickup</td><td>Ready</td></tr>)}</tbody></table>{!pickups.length&&<p className="ru-panel-empty">No jobs ready for handoff.</p>}</article>
    </section>
  </div>;
}
