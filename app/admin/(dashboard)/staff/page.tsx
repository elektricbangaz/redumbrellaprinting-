import { BriefcaseBusiness, Clock3, DollarSign, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StaffRateEditor } from "@/components/admin/StaffRateEditor";
export const dynamic="force-dynamic";
function money(cents:number){return new Intl.NumberFormat("en-JM",{style:"currency",currency:"JMD",maximumFractionDigits:0}).format(cents/100);}
export default async function AdminStaffPage(){
 const staff=await prisma.adminUser.findMany({include:{productionSessions:{include:{workOrder:true},orderBy:{startedAt:"desc"}}},orderBy:{name:"asc"}});
 const now=new Date(); const start=new Date(now);start.setHours(0,0,0,0);
 const completedToday=await prisma.workOrder.count({where:{completedAt:{gte:start}}});
 const rows=staff.map(person=>{const sessions=person.productionSessions;const mins=sessions.reduce((sum,s)=>sum+s.durationMinutes+(s.active?Math.max(0,Math.round((now.getTime()-s.startedAt.getTime())/60000)):0),0);const jobs=new Set(sessions.map(s=>s.workOrderId)).size;const active=sessions.some(s=>s.active);const pay=Math.round(person.hourlyRate*(mins/60));return {person,mins,jobs,active,pay};});
 const hours=rows.reduce((s,r)=>s+r.mins,0)/60;const active=rows.filter(r=>r.active).length;const payroll=rows.reduce((s,r)=>s+r.pay,0);
 return <div className="ru-page">
  <div className="ru-page-heading"><div><h1>Staff & Performance</h1><p>Track staff activity, hours, jobs handled, and pay entitlement.</p></div></div>
  <section className="ru-stat-strip staff">
   <article><BriefcaseBusiness/><span><small>Jobs Completed Today</small><strong>{completedToday}</strong><em>production output</em></span></article>
   <article><Clock3/><span><small>Hours Logged</small><strong>{hours.toFixed(1)}</strong><em>production time</em></span></article>
   <article><Users/><span><small>Operators Active</small><strong>{active}</strong><em>{staff.length} staff accounts</em></span></article>
   <article><DollarSign/><span><small>Estimated Payroll</small><strong>{money(payroll)}</strong><em>from logged hours</em></span></article>
  </section>
  <section className="ru-staff-card"><header><h2>Staff Performance</h2><span>Live production labour</span></header><div className="ru-table-wrap"><table className="ru-queue-table"><thead><tr><th>Staff</th><th>Role</th><th>Jobs Handled</th><th>Active Hours</th><th>Status</th><th>Rate</th><th>Pay Entitlement</th><th></th></tr></thead><tbody>{rows.map(({person,mins,jobs,active,pay})=><tr key={person.id}><td><span className="ru-staff-name"><i>{person.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2)}</i><b>{person.name}</b><small>{person.email}</small></span></td><td>{person.jobTitle||person.role}</td><td>{jobs}</td><td>{(mins/60).toFixed(1)}</td><td><span className={"ru-live-badge "+(active?"active":"")}>{active?"Working":"Offline"}</span></td><td>{person.hourlyRate?money(person.hourlyRate)+"/hr":"Not set"}</td><td><strong>{money(pay)}</strong></td><td><StaffRateEditor id={person.id} jobTitle={person.jobTitle} hourlyRate={person.hourlyRate}/></td></tr>)}</tbody></table></div></section>
  <p className="admin-data-note">Pay entitlement is calculated from recorded production sessions × each staff member&apos;s configured hourly rate. It is an operational estimate, not payroll accounting.</p>
 </div>;
}
