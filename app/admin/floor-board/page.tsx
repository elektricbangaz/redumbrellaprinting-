import { AlertTriangle, CheckCircle2, Clock3, Factory } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export const dynamic = "force-dynamic";

function qty(job:any){return job.order.items.reduce((s:number,i:any)=>s+i.quantity,0);}
function product(job:any){return job.order.items.map((i:any)=>i.product.name).join(", ")||"Print job";}
function worker(job:any){return job.sessions[0]?.staff.name||job.lastWorkedBy||job.assignedTo||"Unassigned";}
function isToday(d:Date|null){if(!d)return false;const n=new Date();return d.toDateString()===n.toDateString();}
function overdue(job:any){return Boolean(job.dueDate&&job.dueDate<new Date()&&!["READY","COMPLETED","CANCELLED"].includes(job.stage));}

export default async function FloorBoardPage(){
  const jobs=await prisma.workOrder.findMany({
    include:{order:{include:{items:{include:{product:true}}}},sessions:{where:{active:true},include:{staff:true},orderBy:{startedAt:"desc"},take:1}},
    orderBy:[{dueDate:"asc"},{createdAt:"asc"}],
  });
  const running=jobs.filter(j=>j.stage==="IN_PROGRESS");
  const due=jobs.filter(j=>isToday(j.dueDate)&&!["COMPLETED","CANCELLED"].includes(j.stage));
  const risk=jobs.filter(j=>overdue(j)||j.priority==="URGENT");
  const next=jobs.filter(j=>["APPROVED","QUEUED"].includes(j.stage)).slice(0,5);
  const completed=jobs.filter(j=>j.stage==="COMPLETED"&&isToday(j.completedAt??j.updatedAt)).slice(0,5);
  const now=new Date();

  return <main className="ru-wallboard">
    <AutoRefresh every={12000}/>
    <header><div><img src="/android-chrome-512x512.png" alt="Red Umbrella Printing"/><span>Production Floor — Live Status</span></div><time>{now.toLocaleString("en-JM",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</time></header>
    <section className="ru-wall-section running"><h2><Factory/> Now Running <b>{running.length}</b></h2><div className="ru-wall-table"><div className="head"><span>Job #</span><span>Customer</span><span>Product</span><span>Progress</span><span>Machine / Station</span><span>Operator</span><span>Due</span></div>{running.map(j=><div key={j.id}><strong>{j.workOrderNumber}</strong><span>{j.order.customerName}</span><span>{product(j)}</span><span><b>{j.progress}%</b><i className="bar"><em style={{width:j.progress+"%"}}/></i></span><span>{j.machine||j.productionMethod||j.productionPhase.replaceAll("_"," ")}</span><span>{worker(j)}</span><span className={overdue(j)?"danger-text":""}>{j.dueDate?j.dueDate.toLocaleTimeString("en-JM",{hour:"numeric",minute:"2-digit"}):"—"}</span></div>)}</div></section>
    <section className="ru-wall-section due"><h2><Clock3/> Due Today <b>{due.length}</b></h2><div className="ru-wall-table compact"><div className="head"><span>Job #</span><span>Customer</span><span>Product</span><span>Progress</span><span>Operator</span><span>Due</span></div>{due.map(j=><div key={j.id}><strong>{j.workOrderNumber}</strong><span>{j.order.customerName}</span><span>{product(j)}</span><span>{j.progress}%</span><span>{worker(j)}</span><span>{j.dueDate?.toLocaleTimeString("en-JM",{hour:"numeric",minute:"2-digit"})}</span></div>)}</div></section>
    <div className="ru-wall-bottom">
      <section className="ru-wall-card risk"><h2><AlertTriangle/> At Risk <b>{risk.length}</b></h2>{risk.slice(0,5).map(j=><div key={j.id}><strong>{j.workOrderNumber}</strong><span>{j.order.customerName}</span><b>{j.progress}%</b><em>{j.dueDate?.toLocaleTimeString("en-JM",{hour:"numeric",minute:"2-digit"})||"Overdue"}</em></div>)}</section>
      <section className="ru-wall-card next"><h2>Next Up <b>{next.length}</b></h2>{next.map(j=><div key={j.id}><strong>{j.workOrderNumber}</strong><span>{j.order.customerName}</span><span>{product(j)}</span></div>)}</section>
      <section className="ru-wall-card done"><h2><CheckCircle2/> Completed Today <b>{completed.length}</b></h2>{completed.map(j=><div key={j.id}><strong>{j.workOrderNumber}</strong><span>{j.order.customerName}</span><span>{worker(j)}</span></div>)}</section>
    </div>
  </main>;
}
