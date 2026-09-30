import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic="force-dynamic";

export default async function AdminCustomerDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const customer=await prisma.customer.findUnique({
    where:{id},
    include:{
      orders:{include:{items:{include:{product:true}}},orderBy:{createdAt:"desc"}},
      designs:{include:{product:true},orderBy:{createdAt:"desc"},take:20},
      quotes:{orderBy:{createdAt:"desc"},take:20},
      invoices:{orderBy:{createdAt:"desc"},take:30},
    },
  });
  if(!customer)notFound();

  const totalOrders=customer.orders.reduce((sum,order)=>sum+order.total,0);
  const paidInvoices=customer.invoices.reduce((sum,invoice)=>sum+invoice.amountPaid,0);
  const outstanding=customer.invoices.filter(invoice=>!["PAID","VOID"].includes(invoice.status)).reduce((sum,invoice)=>sum+invoice.balance,0);

  return <div className="ru-page">
    <div className="admin-header"><div><h1>{customer.name??customer.email}</h1><p>{customer.email}{customer.phone?" · "+customer.phone:""}</p></div></div>
    <div className="admin-kpi-strip">
      <div><small>Orders</small><strong>{customer.orders.length}</strong></div>
      <div><small>Quotes</small><strong>{customer.quotes.length}</strong></div>
      <div><small>Designs</small><strong>{customer.designs.length}</strong></div>
      <div><small>Order value</small><strong>{formatJMD(totalOrders)}</strong></div>
      <div><small>Paid</small><strong>{formatJMD(paidInvoices)}</strong></div>
      <div><small>Outstanding</small><strong>{formatJMD(outstanding)}</strong></div>
    </div>

    <div className="admin-grid-2">
      <section className="admin-card"><h3>Profile</h3><div className="admin-settings-list">
        <div><span>Email</span><strong>{customer.email}</strong></div>
        <div><span>Phone</span><strong>{customer.phone??"—"}</strong></div>
        <div><span>Address</span><strong>{customer.address??"—"}</strong></div>
        <div><span>Customer since</span><strong>{customer.createdAt.toLocaleDateString()}</strong></div>
      </div></section>
      <section className="admin-card"><h3>Financial summary</h3><div className="admin-settings-list">
        <div><span>Total invoiced</span><strong>{formatJMD(customer.invoices.reduce((sum,i)=>sum+i.total,0))}</strong></div>
        <div><span>Amount paid</span><strong>{formatJMD(paidInvoices)}</strong></div>
        <div><span>Balance due</span><strong>{formatJMD(outstanding)}</strong></div>
        <div><span>Open invoices</span><strong>{customer.invoices.filter(i=>!["PAID","VOID"].includes(i.status)).length}</strong></div>
      </div></section>
    </div>

    <section className="admin-card"><h3>Quotes</h3><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Quote</th><th>Job</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>{customer.quotes.map(q=><tr key={q.id}><td><Link href={"/quotes/"+q.id}>{q.quoteNumber}</Link></td><td>{q.jobType}</td><td>{formatJMD(q.total)}</td><td>{q.status}</td><td>{q.createdAt.toLocaleDateString()}</td></tr>)}</tbody>
    </table>{!customer.quotes.length&&<div className="admin-empty">No quotes yet.</div>}</div></section>

    <section className="admin-card"><h3>Orders</h3><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>{customer.orders.map(order=><tr key={order.id}><td><Link href={"/orders/"+order.id}>{order.orderNumber}</Link></td><td>{order.items.map(i=>i.product.name).join(", ")}</td><td>{formatJMD(order.total)}</td><td>{order.paymentStatus}</td><td>{order.status}</td><td>{order.createdAt.toLocaleDateString()}</td></tr>)}</tbody>
    </table>{!customer.orders.length&&<div className="admin-empty">No orders yet.</div>}</div></section>

    <section className="admin-card"><h3>Invoices</h3><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Invoice</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Due</th></tr></thead>
      <tbody>{customer.invoices.map(invoice=><tr key={invoice.id}><td><Link href={"/invoices/"+invoice.id}>{invoice.invoiceNumber}</Link></td><td>{formatJMD(invoice.total)}</td><td>{formatJMD(invoice.amountPaid)}</td><td>{formatJMD(invoice.balance)}</td><td>{invoice.status}</td><td>{invoice.dueDate?.toLocaleDateString()??"—"}</td></tr>)}</tbody>
    </table>{!customer.invoices.length&&<div className="admin-empty">No invoices yet.</div>}</div></section>

    <section className="admin-card"><h3>Design archive</h3><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Product</th><th>Colour</th><th>Preview</th><th>Created</th></tr></thead>
      <tbody>{customer.designs.map(design=><tr key={design.id}><td>{design.product.name}</td><td>{design.color}</td><td>{design.previewImage?<a href={design.previewImage} target="_blank" rel="noreferrer">Open preview</a>:"—"}</td><td>{design.createdAt.toLocaleDateString()}</td></tr>)}</tbody>
    </table>{!customer.designs.length&&<div className="admin-empty">No designs yet.</div>}</div></section>
  </div>;
}
