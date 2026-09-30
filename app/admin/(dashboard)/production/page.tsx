import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductionActions } from "@/components/admin/ProductionActions";

export const dynamic = "force-dynamic";

function qty(job:any){return job.order.items.reduce((s:number,i:any)=>s+i.quantity,0);}
function product(job:any){return job.order.items.map((i:any)=>i.product.name).join(", ")||"Print job";}

export default async function ProductionPage({searchParams}:{searchParams:Promise<{job?:string}>}) {
  const sp=await searchParams;
  const session=await auth();
  const jobs=await prisma.workOrder.findMany({
    where:{stage:{in:["APPROVED","QUEUED","IN_PROGRESS","QUALITY_CHECK"]}},
    include:{order:{include:{items:{include:{product:true}}}},sessions:{where:{active:true},include:{staff:true},orderBy:{startedAt:"desc"},take:1}},
    orderBy:[{dueDate:"asc"},{createdAt:"asc"}],
  });
  const selected=jobs.find(j=>j.id===sp.job)??jobs.find(j=>j.sessions[0]?.staff.email===session?.user?.email)??jobs[0]??null;

  return <div className="ru-page ru-terminal-page">
    <div className="ru-page-heading"><div><h1>Production Floor</h1><p>Operator tablet — start jobs, update progress, and move work through production.</p></div><Link className="ru-wall-link" href="/floor-board" target="_blank">Open Wall Monitor</Link></div>
    <div className="ru-terminal-shell">
      <aside className="ru-terminal-list">
        <header><div><span className="ru-online-dot"/> Online</div><strong>{session?.user?.name||"Operator"}</strong></header>
        <h2>My Jobs</h2>
        {jobs.map(job=><Link key={job.id} className={"ru-terminal-job"+(selected?.id===job.id?" active":"")} href={"/production?job="+job.id}>
          <div><strong>{job.workOrderNumber}</strong><span className={"ru-priority p-"+job.priority.toLowerCase()}>{job.priority}</span></div>
          <b>{job.order.customerName}</b><p>{product(job)}</p>
          <small>{job.progress}% · {job.productionPhase.replaceAll("_"," ")}</small>
        </Link>)}
      </aside>
      {selected?<main className="ru-terminal-detail">
        <header><div><strong>{selected.workOrderNumber}</strong><h2>{selected.order.customerName}</h2><p>{product(selected)}</p></div><div><span className={"ru-priority p-"+selected.priority.toLowerCase()}>{selected.priority}</span><small>Due {selected.dueDate?selected.dueDate.toLocaleDateString():"Not set"}</small></div></header>
        <nav className="ru-detail-tabs"><b>Overview</b><span>Materials</span><span>Checklist</span><span>Notes</span></nav>
        <section className="ru-terminal-progress"><label>Production Progress <strong>{selected.progress}%</strong></label><div><i style={{width:selected.progress+"%"}}/></div><div className="ru-terminal-facts"><span><small>Quantity</small><strong>{qty(selected).toLocaleString()} pcs</strong></span><span><small>Machine</small><strong>{selected.machine||selected.productionMethod||"Not assigned"}</strong></span><span><small>Phase</small><strong>{selected.productionPhase.replaceAll("_"," ")}</strong></span><span><small>Last Worker</small><strong>{selected.sessions[0]?.staff.name||selected.lastWorkedBy||selected.assignedTo||"—"}</strong></span></div></section>
        <ProductionActions id={selected.id} progress={selected.progress} phase={selected.productionPhase}/>
        <section className="ru-terminal-assigned"><h3>Today&apos;s Assigned Jobs</h3>{jobs.slice(0,6).map(job=><div key={job.id}><span>{job.workOrderNumber}</span><b>{job.order.customerName}</b><span>{job.progress}%</span><span>{job.productionPhase.replaceAll("_"," ")}</span></div>)}</section>
      </main>:<div className="ru-terminal-empty">No production jobs are currently queued.</div>}
    </div>
  </div>;
}
