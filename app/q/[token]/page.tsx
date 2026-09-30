import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { QuoteResponse } from "./QuoteResponse";

export const dynamic="force-dynamic";

export default async function PublicQuotePage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const quote=await prisma.quote.findUnique({where:{publicToken:token},include:{items:{orderBy:{sortOrder:"asc"}}}});
 if(!quote)notFound();
 return <main className="sf"><SiteHeader/><section className="public-doc-shell"><article className="public-doc">
  <header><div><span>QUOTE</span><h1>{quote.quoteNumber}</h1></div><div><small>Issue date</small><strong>{quote.issueDate.toLocaleDateString()}</strong><small>Valid until</small><strong>{quote.validUntil?.toLocaleDateString()||"Until withdrawn"}</strong></div></header>
  <section className="public-doc-bill"><div><small>Prepared for</small><strong>{quote.customerName}</strong>{quote.company&&<span>{quote.company}</span>}<span>{quote.customerEmail}</span></div><div><small>Job</small><strong>{quote.jobType}</strong></div></section>
  <section className="public-doc-lines"><div className="head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span></div>{quote.items.map(item=><div key={item.id}><span>{item.description}</span><span>{item.quantity}</span><span>{formatJMD(item.unitPrice)}</span><strong>{formatJMD(item.lineTotal)}</strong></div>)}</section>
  <section className="public-doc-bottom"><div><h2>Production brief</h2><p>{quote.details}</p>{quote.notes&&<><h2>Notes / terms</h2><p>{quote.notes}</p></>}</div><div className="public-doc-totals"><div><span>Subtotal</span><strong>{formatJMD(quote.subtotal)}</strong></div><div><span>Tax</span><strong>{formatJMD(quote.tax)}</strong></div><div className="total"><span>Total</span><strong>{formatJMD(quote.total)}</strong></div></div></section>
  <QuoteResponse token={quote.publicToken} status={quote.status}/>
 </article></section><SiteFooter/></main>;
}
