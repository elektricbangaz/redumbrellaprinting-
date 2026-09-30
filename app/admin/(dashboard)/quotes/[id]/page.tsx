import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuoteEditor } from "./QuoteEditor";

export const dynamic="force-dynamic";

export default async function AdminQuoteDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const quote=await prisma.quote.findUnique({
    where:{id},
    include:{items:{orderBy:{sortOrder:"asc"}}},
  });
  if(!quote)notFound();

  return <QuoteEditor
    id={quote.id}
    quoteNumber={quote.quoteNumber}
    status={quote.status}
    issueDate={quote.issueDate.toISOString().slice(0,10)}
    validUntil={quote.validUntil?.toISOString().slice(0,10)??null}
    customerName={quote.customerName}
    customerEmail={quote.customerEmail}
    customerPhone={quote.customerPhone}
    company={quote.company}
    jobType={quote.jobType}
    details={quote.details}
    artworkUrl={quote.artworkUrl}
    budget={quote.budget}
    notes={quote.notes}
    taxJmd={quote.tax/100}
    items={quote.items.map(item=>({description:item.description,quantity:item.quantity,unitPriceJmd:item.unitPrice/100}))}
  />;
}
