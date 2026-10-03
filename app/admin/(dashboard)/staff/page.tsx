import { BriefcaseBusiness, Clock3, DollarSign, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StaffRateEditor } from "@/components/admin/StaffRateEditor";
import { StaffOperations } from "./StaffOperations";

export const dynamic = "force-dynamic";
function money(cents:number){return new Intl.NumberFormat("en-JM",{style:"currency",currency:"JMD",maximumFractionDigits:0}).format(cents/100);}

export default async function AdminStaffPage(){
 const session=await auth();
 const now=new Date(); const dayStart=new Date(now); dayStart.setHours(0,0,0,0); const shiftHorizon=new Date(now.getTime()+14*24*60*60*1000);
 const [staff,completedToday,workstations,shifts]=await Promise.all([
  prisma.adminUser.findMany({include:{productionSessions:{include:{workOrder:true},orderBy:{startedAt:"desc"}},clockEntries:{orderBy:{clockIn:"desc"},take:100}},orderBy:{name:"asc"}}),
  prisma.workOrder.count({where:{completedAt:{gte:dayStart}}}),
  prisma.workstation.findMany({where:{active:true},orderBy:[{area:"asc"},{name:"asc"}]}),
  prisma.staffShift.findMany({where:{endsAt:{gte:dayStart},startsAt:{lte:shiftHorizon}},include:{staff:true,workstation:true},orderBy:{startsAt:"asc"},take:100}),
 ]);
 const rows=staff.map(person=>{
  const jobMinutes=person.productionSessions.reduce((sum,s)=>sum+s.durationMinutes+(s.active?Math.max(0,Math.round((now.getTime()-s.startedAt.getTime())/60000)):0),0);
  const clockMinutes=person.clockEntries.reduce((sum,e)=>sum+e.durationMinutes+(e.clockOut?0:Math.max(0,Math.round((now.getTime()-e.clockIn.getTime())/60000))),0);
  const jobs=new Set(person.productionSessions.map(s=>s.workOrderId)).size;
  const active=person.productionSessions.some(s=>s.active);
  const clockedIn=person.clockEntries.some(e=>!e.clockOut);
  const pay=Math.round(person.hourlyRate*(clockMinutes/60));
  return {person,jobMinutes,clockMinutes,jobs,active,clockedIn,pay};
 });
 const paidHours=rows.reduce((sum,row)=>sum+row.clockMinutes,0)/60;
 const active=rows.filter(row=>row.active||row.clockedIn).length;
 const payroll=rows.reduce((sum,row)=>sum+row.pay,0);
 const currentUser=staff.find(person=>person.email===session?.user?.email);
 const currentClock=currentUser?.clockEntries.find(entry=>!entry.clockOut)??null;
 const isAdmin=(session?.user as {role?:string}|undefined)?.role==="ADMIN";

 return <div className="ru-page">
  <div className="ru-page-heading"><div><h1>Staff & Workforce</h1><p>Onboard staff, schedule shifts, clock time, assign workstations, track production activity and calculate pay entitlement.</p></div></div>
  <section className="ru-stat-strip staff">
   <article><BriefcaseBusiness/><span><small>Jobs Completed Today</small><strong>{completedToday}</strong><em>production output</em></span></article>
   <article><Clock3/><span><small>Clocked Hours</small><strong>{paidHours.toFixed(1)}</strong><em>payable attendance</em></span></article>
   <article><Users/><span><small>People Active</small><strong>{active}</strong><em>{staff.filter(s=>s.active).length} active accounts</em></span></article>
   <article><DollarSign/><span><small>Estimated Payroll</small><strong>{money(payroll)}</strong><em>clocked time × rate</em></span></article>
  </section>

  <StaffOperations
   staff={staff.map(person=>({id:person.id,name:person.name,email:person.email,jobTitle:person.jobTitle,role:person.role,active:person.active,hourlyRate:person.hourlyRate}))}
   workstations={workstations.map(station=>({id:station.id,name:station.name,area:station.area}))}
   shifts={shifts.map(shift=>({id:shift.id,staffName:shift.staff.name,workstationName:shift.workstation?.name??null,startsAt:shift.startsAt.toISOString(),endsAt:shift.endsAt.toISOString(),status:shift.status}))}
   currentClock={currentClock?{id:currentClock.id,clockIn:currentClock.clockIn.toISOString(),workstationName:workstations.find(station=>station.id===currentClock.workstationId)?.name??null}:null}
   isAdmin={isAdmin}
  />

  <section className="ru-staff-card"><header><h2>Staff Performance</h2><span>Attendance + live job activity</span></header><div className="ru-table-wrap"><table className="ru-queue-table"><thead><tr><th>Staff</th><th>Role</th><th>Jobs Handled</th><th>Job Hours</th><th>Clocked Hours</th><th>Status</th><th>Rate</th><th>Pay Entitlement</th><th></th></tr></thead><tbody>{rows.map(({person,jobMinutes,clockMinutes,jobs,active,clockedIn,pay})=><tr key={person.id}><td><span className="ru-staff-name"><i>{person.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2)}</i><b>{person.name}</b><small>{person.email}</small></span></td><td>{person.jobTitle||person.role}</td><td>{jobs}</td><td>{(jobMinutes/60).toFixed(1)}</td><td>{(clockMinutes/60).toFixed(1)}</td><td><span className={"ru-live-badge "+(active||clockedIn?"active":"")}>{active?"On job":clockedIn?"Clocked in":"Offline"}</span></td><td>{person.hourlyRate?money(person.hourlyRate)+"/hr":"Not set"}</td><td><strong>{money(pay)}</strong></td><td><StaffRateEditor id={person.id} jobTitle={person.jobTitle} hourlyRate={person.hourlyRate}/></td></tr>)}</tbody></table></div></section>
  <p className="admin-data-note">Pay entitlement uses Staff Time Clock entries × each person&apos;s configured hourly rate. Production sessions remain separate so you can compare paid hours with actual job time.</p>
 </div>;
}
