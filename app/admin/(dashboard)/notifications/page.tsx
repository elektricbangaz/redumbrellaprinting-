import { prisma } from "@/lib/prisma";

export const dynamic="force-dynamic";

export default async function NotificationsPage(){
 const rows=await prisma.notification.findMany({orderBy:{createdAt:"desc"},take:250});
 const sent=rows.filter(row=>row.status==="SENT").length,failed=rows.filter(row=>row.status==="FAILED").length,skipped=rows.filter(row=>row.status==="SKIPPED").length;
 return <div className="ru-page">
  <div className="ru-page-heading"><div><h1>Notifications</h1><p>Operational email and WhatsApp delivery log for customer and supplier events.</p></div></div>
  <div className="admin-kpi-strip"><div><small>Recent events</small><strong>{rows.length}</strong></div><div><small>Sent</small><strong>{sent}</strong></div><div><small>Failed</small><strong>{failed}</strong></div><div><small>Skipped / not configured</small><strong>{skipped}</strong></div></div>
  <section className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Time</th><th>Event</th><th>Channel</th><th>Recipient</th><th>Status</th><th>Message</th><th>Error</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.createdAt.toLocaleString()}</td><td>{row.event.replaceAll("_"," ")}</td><td>{row.channel}</td><td>{row.recipient}</td><td><span className={"ru-status-pill s-"+row.status.toLowerCase()}>{row.status}</span></td><td>{row.message.slice(0,120)}{row.message.length>120?"…":""}</td><td>{row.error||"—"}</td></tr>)}</tbody></table>{!rows.length&&<div className="admin-empty">No operational notifications have been recorded yet.</div>}</div></section>
 </div>;
}
