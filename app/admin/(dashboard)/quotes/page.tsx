import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic="force-dynamic";

export default async function AdminQuotesPage({searchParams}:{searchParams:Promise<{status?:string}>}){
  const sp=await searchParams;
  const where=sp.status?{status:sp.status as any}:{};
  const quotes=await prisma.quote.findMany({
    where,
    include:{items:true},
    orderBy:{createdAt:"desc"},
    take:100,
  });
  const counts=await prisma.quote.groupBy({by:["status"],_count:{_all:true}});
  const countMap=new Map(counts.map(row=>[row.status,row._count._all]));
  return <div className="ru-page">
    <div className="admin-header">
      <div><h1>Quotes</h1><p>Customer requests, estimates and formal quotes — one pipeline.</p></div>
    </div>
    <div className="admin-kpi-strip">
      <div><small>Requested</small><strong>{countMap.get("REQUESTED")??0}</strong></div>
      <div><small>Draft</small><strong>{countMap.get("DRAFT")??0}</strong></div>
      <div><small>Sent</small><strong>{countMap.get("SENT")??0}</strong></div>
      <div><small>Accepted</small><strong>{countMap.get("ACCEPTED")??0}</strong></div>
      <div><small>Converted</small><strong>{countMap.get("CONVERTED")??0}</strong></div>
    </div>
    <div className="admin-toolbar">
      <Link href="/quotes">All</Link>
      {["REQUESTED","DRAFT","SENT","ACCEPTED","CONVERTED","DECLINED"].map(status=><Link key={status} href={"/quotes?status="+status}>{status.replaceAll("_"," ")}</Link>)}
    </div>
    <div className="admin-card">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Quote</th><th>Customer</th><th>Job</th><th>Created</th><th>Valid Until</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{quotes.map(q=><tr key={q.id}>
            <td><Link href={"/quotes/"+q.id}>{q.quoteNumber}</Link></td>
            <td>{q.customerName}<small>{q.customerEmail}</small></td>
            <td>{q.jobType}<small>{q.items[0]?.description||"Production review"}</small></td>
            <td>{q.createdAt.toLocaleDateString()}</td>
            <td>{q.validUntil?.toLocaleDateString()||"—"}</td>
            <td>{formatJMD(q.total)}</td>
            <td><span className={"ru-status-pill s-"+q.status.toLowerCase()}>{q.status.replaceAll("_"," ")}</span></td>
          </tr>)}</tbody>
        </table>
        {!quotes.length&&<div className="admin-empty">No quotes match this view.</div>}
      </div>
    </div>
  </div>;
}
