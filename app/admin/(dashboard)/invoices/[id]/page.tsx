import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoiceEditor } from "./InvoiceEditor";
export const dynamic="force-dynamic";
export default async function InvoiceDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const invoice=await prisma.invoice.findUnique({where:{id},include:{customer:true,items:{orderBy:{sortOrder:"asc"}}}});
 if(!invoice)notFound();
 return <InvoiceEditor id={invoice.id} invoiceNumber={invoice.invoiceNumber} status={invoice.status}
  issueDate={invoice.issueDate.toISOString().slice(0,10)} dueDate={invoice.dueDate?.toISOString().slice(0,10)??null}
  customerName={invoice.customer.name||"Customer"} customerEmail={invoice.customer.email} customerPhone={invoice.customer.phone}
  subtotalJmd={invoice.subtotal/100} taxJmd={invoice.tax/100} totalJmd={invoice.total/100}
  amountPaidJmd={invoice.amountPaid/100} balanceJmd={invoice.balance/100} notes={invoice.notes}
  items={invoice.items.map(item=>({description:item.description,quantity:item.quantity,unitPriceJmd:item.unitPrice/100,lineTotalJmd:item.lineTotal/100}))}/>;
}
