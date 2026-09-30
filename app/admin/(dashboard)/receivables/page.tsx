import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic="force-dynamic";

export default async function AdminReceivablesPage(){
  const now=new Date();
  const invoices=await prisma.invoice.findMany({
    where:{status:{in:["SENT","PARTIAL","OVERDUE"]}},
    include:{customer:true},
    orderBy:[{dueDate:"asc"},{createdAt:"asc"}],
  });
  const total=invoices.reduce((sum,invoice)=>sum+invoice.balance,0);
  const overdue=invoices.filter(invoice=>invoice.status==="OVERDUE" || Boolean(invoice.dueDate && invoice.dueDate<now)).length;
  return <div className="ru-page">
    <div className="admin-header"><div><h1>Receivables</h1><p>Outstanding customer balances from the invoice ledger.</p></div></div>
    <div className="admin-kpi-strip">
      <div><small>Outstanding balance</small><strong>{formatJMD(total)}</strong></div>
      <div><small>Invoices needing follow-up</small><strong>{invoices.length}</strong></div>
      <div><small>Overdue</small><strong>{overdue}</strong></div>
    </div>
    <div className="admin-card"><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Invoice</th><th>Customer</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Balance</th><th></th></tr></thead>
      <tbody>{invoices.map(invoice=><tr key={invoice.id}>
        <td>{invoice.invoiceNumber}</td>
        <td>{invoice.customer.name||"Customer"}<small>{invoice.customer.email}</small></td>
        <td>{invoice.issueDate.toLocaleDateString()}</td>
        <td>{invoice.dueDate?.toLocaleDateString()||"—"}</td>
        <td>{invoice.status}</td>
        <td>{formatJMD(invoice.balance)}</td>
        <td><Link href={"/invoices/"+invoice.id}>Open invoice</Link></td>
      </tr>)}</tbody>
    </table>{!invoices.length&&<div className="admin-empty">No outstanding invoices.</div>}</div></div>
  </div>;
}
