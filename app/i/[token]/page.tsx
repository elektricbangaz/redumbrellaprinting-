import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic="force-dynamic";

export default async function PublicInvoicePage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const invoice=await prisma.invoice.findUnique({
    where:{publicToken:token},
    include:{customer:true,items:{orderBy:{sortOrder:"asc"}},order:true},
  });
  if(!invoice)notFound();

  const payHref=invoice.order && invoice.balance>0
    ? `/pay/${invoice.order.orderNumber}?provider=WIPAY`
    : null;

  return <main className="sf">
    <SiteHeader/>
    <section className="public-doc-shell">
      <article className="public-doc">
        <header>
          <div><span>INVOICE</span><h1>{invoice.invoiceNumber}</h1></div>
          <div>
            <small>Issue date</small><strong>{invoice.issueDate.toLocaleDateString()}</strong>
            <small>Due date</small><strong>{invoice.dueDate?.toLocaleDateString()||"Due on receipt"}</strong>
          </div>
        </header>
        <section className="public-doc-bill">
          <div><small>Bill to</small><strong>{invoice.customer.name||"Customer"}</strong><span>{invoice.customer.email}</span>{invoice.customer.phone&&<span>{invoice.customer.phone}</span>}</div>
          <div><small>Status</small><strong>{invoice.status.replaceAll("_"," ")}</strong></div>
        </section>
        <section className="public-doc-lines">
          <div className="head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span></div>
          {invoice.items.map(item=><div key={item.id}><span>{item.description}</span><span>{item.quantity}</span><span>{formatJMD(item.unitPrice)}</span><strong>{formatJMD(item.lineTotal)}</strong></div>)}
        </section>
        <section className="public-doc-bottom">
          <div>{invoice.notes&&<><h2>Notes / terms</h2><p>{invoice.notes}</p></>}</div>
          <div className="public-doc-totals">
            <div><span>Subtotal</span><strong>{formatJMD(invoice.subtotal)}</strong></div>
            <div><span>Tax</span><strong>{formatJMD(invoice.tax)}</strong></div>
            <div><span>Paid</span><strong>{formatJMD(invoice.amountPaid)}</strong></div>
            <div className="total"><span>Balance due</span><strong>{formatJMD(invoice.balance)}</strong></div>
          </div>
        </section>
        {invoice.status==="PAID"
          ? <div className="public-doc-response accepted"><strong>Paid in full</strong><p>Thank you. This invoice has been settled.</p></div>
          : payHref
            ? <div className="public-doc-actions"><a className="sf-primary" href={payHref}>Pay invoice</a><span className="public-payment-note">Online payment availability depends on the configured merchant gateway.</span></div>
            : <div className="public-doc-response"><strong>Payment pending</strong><p>Contact Red Umbrella Printing to arrange payment.</p></div>}
      </article>
    </section>
    <SiteFooter/>
  </main>;
}
