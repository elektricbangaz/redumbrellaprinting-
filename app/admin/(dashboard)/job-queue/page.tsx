import Link from "next/link";
import { AlertTriangle, Clock3, FileImage, Filter, ListFilter, PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WorkOrderControls } from "@/components/admin/WorkOrderControls";

export const dynamic = "force-dynamic";

function product(job:any){return job.order.items.map((i:any)=>i.product.name).join(", ") || "Print job";}
function qty(job:any){return job.order.items.reduce((s:number,i:any)=>s+i.quantity,0);}
function overdue(job:any){return Boolean(job.dueDate && job.dueDate < new Date() && !["READY","COMPLETED","CANCELLED"].includes(job.stage));}
function stageLabel(job:any){
  if(job.stage==="IN_PROGRESS") return job.productionPhase==="PRINTING"?"Printing":job.productionPhase==="FINISHING"?"Finishing":"Pre-Press";
  const m:Record<string,string>={SUBMITTED:"New",REVIEW:"Awaiting Artwork",NEEDS_CUSTOMER_APPROVAL:"Awaiting Approval",APPROVED:"Ready to Print",QUEUED:"Ready to Print",QUALITY_CHECK:"Quality Check",READY:"Ready",COMPLETED:"Completed",ON_HOLD:"On Hold",CANCELLED:"Cancelled"};
  return m[job.stage]||job.stage.replaceAll("_"," ");
}

export default async function JobQueuePage({searchParams}:{searchParams:Promise<{q?:string;stage?:string;job?:string}>}) {
  const sp=await searchParams;
  const all=await prisma.workOrder.findMany({
    include:{order:{include:{items:{include:{product:true}}}},events:{orderBy:{createdAt:"desc"},take:5}},
    orderBy:[{dueDate:"asc"},{createdAt:"asc"}],
  });
  let jobs=all;
  if(sp.q){const q=sp.q.toLowerCase();jobs=jobs.filter((j)=>[j.workOrderNumber,j.order.orderNumber,j.order.customerName,product(j)].join(" ").toLowerCase().includes(q));}
  if(sp.stage==="OVERDUE") jobs=jobs.filter(overdue);
  else if(sp.stage==="PRINTING") jobs=jobs.filter((j)=>j.stage==="IN_PROGRESS" && j.productionPhase==="PRINTING");
  else if(sp.stage==="FINISHING") jobs=jobs.filter((j)=>j.stage==="IN_PROGRESS" && j.productionPhase==="FINISHING");
  else if(sp.stage) jobs=jobs.filter((j)=>j.stage===sp.stage || stageLabel(j).toUpperCase().replaceAll(" ","_")===sp.stage);
  const selected=all.find((j)=>j.id===sp.job)??jobs[0]??null;
  const waitingArtwork=all.filter((j)=>["SUBMITTED","REVIEW"].includes(j.stage)).length;
  const waitingApproval=all.filter((j)=>j.stage==="NEEDS_CUSTOMER_APPROVAL").length;
  const ready=all.filter((j)=>["APPROVED","QUEUED"].includes(j.stage)).length;
  const rush=all.filter((j)=>["HIGH","URGENT"].includes(j.priority)).length;
  const late=all.filter(overdue).length;

  return <div className="ru-page ru-queue-page">
    <div className="ru-page-heading"><div><h1>Job Queue</h1><p>Track, prioritize, and route print jobs from intake to production.</p></div></div>

    <section className="ru-stat-strip queue">
      <article><PackageCheck/><span><small>Total in Queue</small><strong>{all.filter(j=>!["COMPLETED","CANCELLED"].includes(j.stage)).length}</strong><em>active jobs</em></span></article>
      <article><FileImage/><span><small>Waiting for Artwork</small><strong>{waitingArtwork}</strong><em>needs customer files</em></span></article>
      <article><Clock3/><span><small>Waiting for Approval</small><strong>{waitingApproval}</strong><em>proofs sent</em></span></article>
      <article><PackageCheck/><span><small>Ready for Production</small><strong>{ready}</strong><em>ready to print</em></span></article>
      <article><AlertTriangle/><span><small>Rush Jobs</small><strong>{rush}</strong><em>high priority</em></span></article>
      <article className="danger"><AlertTriangle/><span><small>Overdue</small><strong>{late}</strong><em>past due date</em></span></article>
    </section>

    <div className="ru-queue-layout">
      <section className="ru-queue-main">
        <form className="ru-queue-filters" method="get">
          <input name="q" defaultValue={sp.q||""} placeholder="Search job #, customer, product..."/>
          <select name="stage" defaultValue={sp.stage||""}><option value="">All Stages</option><option value="SUBMITTED">New</option><option value="REVIEW">Artwork</option><option value="NEEDS_CUSTOMER_APPROVAL">Approval</option><option value="QUEUED">Ready</option><option value="IN_PROGRESS">Production</option><option value="QUALITY_CHECK">Quality Check</option><option value="READY">Ready for Pickup</option><option value="OVERDUE">Overdue</option></select>
          <button><Filter size={14}/> Filters</button>
        </form>

        <div className="ru-stage-tabs">
          {[
            ["","All"],["SUBMITTED","New"],["REVIEW","Artwork"],["NEEDS_CUSTOMER_APPROVAL","Approval"],
            ["QUEUED","Ready"],["PRINTING","Printing"],["FINISHING","Finishing"],["COMPLETED","Completed"],["OVERDUE","Overdue"]
          ].map(([v,l])=><Link key={v} className={sp.stage===v||(!sp.stage&&v==="")?"active":""} href={"/job-queue"+(v?"?stage="+v:"")}>{l}</Link>)}
        </div>

        <div className="ru-queue-toolbar"><span>{selected ? "1 selected" : "0 selected"}</span>{selected ? <><a href="#manage-job">Assign</a><a href="#manage-job">Move Stage</a><Link href={"/orders/"+selected.orderId}>Print Ticket</Link><a href="#manage-job">Mark Priority</a></> : <><button disabled>Assign</button><button disabled>Move Stage</button><button disabled>Print Ticket</button><button disabled>Mark Priority</button></>}<button><ListFilter size={14}/> Sort: Due Date</button></div>

        <div className="ru-table-wrap"><table className="ru-queue-table">
          <thead><tr><th></th><th>Queue #</th><th>Job ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Due Date</th><th>Stage</th></tr></thead>
          <tbody>{jobs.map((job,i)=><tr key={job.id} className={selected?.id===job.id?"selected":""}>
            <td><input type="checkbox"/></td><td>{i+1}</td><td><Link href={"/job-queue?job="+job.id+(sp.stage?"&stage="+sp.stage:"")}>{job.workOrderNumber}</Link></td>
            <td>{job.order.customerName}</td><td>{product(job)}</td><td>{qty(job).toLocaleString()}</td>
            <td><span className={"ru-status-pill s-"+job.stage.toLowerCase()}>{stageLabel(job)}</span></td>
            <td><span className={"ru-priority p-"+job.priority.toLowerCase()}>{job.priority}</span></td>
            <td>{job.lastWorkedBy||job.assignedTo||"Unassigned"}</td>
            <td className={overdue(job)?"danger-text":""}>{job.dueDate?job.dueDate.toLocaleDateString("en-JM",{month:"short",day:"numeric",year:"numeric"}):"—"}</td>
            <td>{job.productionPhase?.replaceAll("_"," ")||job.stage.replaceAll("_"," ")}</td>
          </tr>)}</tbody>
        </table></div>
      </section>

      {selected&&<aside className="ru-queue-detail">
        <header><div><h2>Job Details</h2><strong>{selected.workOrderNumber}</strong></div><span className={"ru-status-pill s-"+selected.stage.toLowerCase()}>{stageLabel(selected)}</span></header>
        <div className="ru-job-detail-title"><div><h2>{selected.order.customerName}</h2><p>{product(selected)}</p><p>{qty(selected).toLocaleString()} pcs</p></div></div>
        <nav className="ru-detail-tabs"><b>Overview</b><span>Artwork</span><span>Proofs</span><span>Timeline</span></nav>
        <dl>
          <div><dt>Due Date</dt><dd className={overdue(selected)?"danger-text":""}>{selected.dueDate?selected.dueDate.toLocaleDateString():"Not set"}</dd></div>
          <div><dt>Priority</dt><dd>{selected.priority}</dd></div>
          <div><dt>Status</dt><dd>{stageLabel(selected)}</dd></div>
          <div><dt>Stage</dt><dd>{selected.productionPhase.replaceAll("_"," ")}</dd></div>
          <div><dt>Assigned To</dt><dd>{selected.lastWorkedBy||selected.assignedTo||"Unassigned"}</dd></div>
          <div><dt>Customer</dt><dd>{selected.order.customerName}</dd></div>
        </dl>
        <div className="ru-detail-block"><h3>Artwork Status</h3><p>{selected.order.items.some((i)=>i.designId)?"Artwork attached":"No files uploaded"}</p></div>
        <div className="ru-detail-block"><h3>Recent Activity</h3>{selected.events.map((e)=><p key={e.id}><strong>{e.changedBy||"System"}</strong> · {e.note||"Updated"}<small>{e.createdAt.toLocaleString()}</small></p>)}</div>
        <div id="manage-job" className="ru-queue-manage"><h3>Manage Job</h3><WorkOrderControls id={selected.id} stage={selected.stage} priority={selected.priority} assignedTo={selected.assignedTo} dueDate={selected.dueDate?.toISOString().slice(0,10) ?? null} productionMethod={selected.productionMethod} placement={selected.placement} blockedReason={selected.blockedReason} paymentStatus={selected.order.paymentStatus}/></div><div className="ru-detail-actions"><Link href={"/jobs?job="+selected.id}>Open on Production Board</Link><Link href={"/production?job="+selected.id}>Open on Floor Tablet</Link></div>
      </aside>}
    </div>
  </div>;
}
