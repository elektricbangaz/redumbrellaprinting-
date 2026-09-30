import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic="force-dynamic";

export default async function AdminPaymentsPage(){
  const [transactions,pendingInvoices]=await Promise.all([
    prisma.paymentTransaction.findMany({
      include:{order:true,invoice:{include:{customer:true}}},
      orderBy:{createdAt:"desc"},
      take:150,
    }),
    prisma.invoice.findMany({
      where:{status:{in:["SENT","PARTIAL","OVERDUE"]}},
      include:{customer:true},
      orderBy:{dueDate:"asc"},
      take:50,
    }),
  ]);
  const captured=transactions.filter(t=>t.status==="PAID").reduce((sum,t)=>sum+t.amount,0);
  const pending=pendingInvoices.reduce((sum,i)=>sum+i.balance,0);
  const gateway=transactions.filter(t=>t.source==="GATEWAY").reduce((sum,t)=>sum+t.amount,0);
  const manual=transactions.filter(t=>t.source==="ADMIN").reduce((sum,t)=>sum+t.amount,0);

  return <div className="ru-page">
    <div className="admin-header"><div><h1>Payments</h1><p>Transaction ledger across invoices, storefront orders and manual payments.</p></div></div>
    <div className="admin-kpi-strip">
      <div><small>Captured</small><strong>{formatJMD(captured)}</strong></div>
      <div><small>Outstanding</small><strong>{formatJMD(pending)}</strong></div>
      <div><small>Gateway captured</small><strong>{formatJMD(gateway)}</strong></div>
      <div><small>Manual captured</small><strong>{formatJMD(manual)}</strong></div>
      <div><small>Transactions</small><strong>{transactions.length}</strong></div>
    </div>

    <section className="admin-card">
      <h2>Transaction ledger</h2>
      <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>Date</th><th>Source</th><th>Provider</th><th>Reference</th><th>Customer / Order</th><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{transactions.map(t=><tr key={t.id}>
          <td>{t.createdAt.toLocaleString()}</td>
          <td>{t.source}</td>
          <td>{t.provider??"—"}</td>
          <td>{t.reference??"—"}</td>
          <td>{t.order?<Link href={"/orders/"+t.order.id}>{t.order.customerName}<small>{t.order.orderNumber}</small></Link>:(t.invoice?.customer.name??"—")}</td>
          <td>{t.invoice?<Link href={"/invoices/"+t.invoice.id}>{t.invoice.invoiceNumber}</Link>:"—"}</td>
          <td>{formatJMD(t.amount)}</td>
          <td><span className={"ru-status-pill s-"+t.status.toLowerCase()}>{t.status}</span></td>
        </tr>)}</tbody>
      </table>{!transactions.length&&<div className="admin-empty">No payment transactions recorded yet.</div>}</div>
    </section>

    <section className="admin-card">
      <h2>Balances awaiting payment</h2>
      <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>Invoice</th><th>Customer</th><th>Due</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>{pendingInvoices.map(i=><tr key={i.id}>
          <td><Link href={"/invoices/"+i.id}>{i.invoiceNumber}</Link></td>
          <td>{i.customer.name??i.customer.email}</td><td>{i.dueDate?.toLocaleDateString()??"—"}</td>
          <td>{formatJMD(i.balance)}</td><td>{i.status}</td>
        </tr>)}</tbody>
      </table>{!pendingInvoices.length&&<div className="admin-empty">No outstanding invoice balances.</div>}</div>
    </section>
  </div>;
}
