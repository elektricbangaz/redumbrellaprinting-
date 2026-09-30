import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic="force-dynamic";

export default async function AdminInvoicesPage({searchParams}:{searchParams:Promise<{status?:string}>}){
  const sp=await searchParams;
  const invoices=await prisma.invoice.findMany({
    where:sp.status?{status:sp.status as any}:{},
    include:{customer:true},
    orderBy:{createdAt:"desc"},
    take:100,
  });
  const counts=await prisma.invoice.groupBy({by:["status"],_count:{_all:true}});
  const countMap=new Map(counts.map(row=>[row.status,row._count._all]));
  const outstanding=invoices.filter(i=>!["PAID","VOID"].includes(i.status)).reduce((sum,i)=>sum+i.balance,0);

  return <div className="ru-page">
    <div className="admin-header"><div><h1>Invoices</h1><p>Billing, payment status and outstanding balances.</p></div></div>
    <div className="admin-kpi-strip">
      <div><small>Outstanding</small><strong>{formatJMD(outstanding)}</strong></div>
      <div><small>Draft</small><strong>{countMap.get("DRAFT")??0}</strong></div>
      <div><small>Sent</small><strong>{countMap.get("SENT")??0}</strong></div>
      <div><small>Partial</small><strong>{countMap.get("PARTIAL")??0}</strong></div>
      <div><small>Paid</small><strong>{countMap.get("PAID")??0}</strong></div>
    </div>
    <div className="admin-toolbar"><Link href="/invoices">All</Link>{["DRAFT","SENT","PARTIAL","PAID","OVERDUE","VOID"].map(status=><Link key={status} href={"/invoices?status="+status}>{status}</Link>)}</div>
    <div className="admin-card">
      <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>Invoice</th><th>Customer</th><th>Issue Date</th><th>Due Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>{invoices.map(i=><tr key={i.id}>
          <td><Link href={"/invoices/"+i.id}>{i.invoiceNumber}</Link></td>
          <td>{i.customer.name||"Customer"}<small>{i.customer.email}</small></td>
          <td>{i.issueDate.toLocaleDateString()}</td>
          <td>{i.dueDate?.toLocaleDateString()||"—"}</td>
          <td>{formatJMD(i.total)}</td><td>{formatJMD(i.amountPaid)}</td><td>{formatJMD(i.balance)}</td>
          <td><span className={"ru-status-pill s-"+i.status.toLowerCase()}>{i.status}</span></td>
        </tr>)}</tbody>
      </table>{!invoices.length&&<div className="admin-empty">No invoices match this view.</div>}</div>
    </div>
  </div>;
}
