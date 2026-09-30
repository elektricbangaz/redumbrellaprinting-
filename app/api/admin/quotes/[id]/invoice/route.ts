import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/order-numbers";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const quote=await prisma.quote.findUnique({
    where:{id},
    include:{items:{orderBy:{sortOrder:"asc"}}},
  });
  if(!quote) return NextResponse.json({error:"Quote not found."},{status:404});

  const existing=await prisma.invoice.findFirst({where:{quoteId:id,status:{not:"VOID"}}});
  if(existing) return NextResponse.json({ok:true,invoiceId:existing.id,invoiceNumber:existing.invoiceNumber});

  const dueDate=new Date();
  dueDate.setDate(dueDate.getDate()+14);

  const invoice=await prisma.$transaction(async(tx)=>{
    const created=await tx.invoice.create({
      data:{
        invoiceNumber:generateInvoiceNumber(),
        customerId:quote.customerId,
        quoteId:quote.id,
        status:"DRAFT",
        issueDate:new Date(),
        dueDate,
        subtotal:quote.subtotal,
        tax:quote.tax,
        total:quote.total,
        balance:quote.total,
        currency:quote.currency,
        notes:quote.notes,
        items:{create:quote.items.map(item=>({
          description:item.description,
          quantity:item.quantity,
          unitPrice:item.unitPrice,
          lineTotal:item.lineTotal,
          sortOrder:item.sortOrder,
        }))},
      },
    });
    return created;
  });

  return NextResponse.json({ok:true,invoiceId:invoice.id,invoiceNumber:invoice.invoiceNumber});
}
