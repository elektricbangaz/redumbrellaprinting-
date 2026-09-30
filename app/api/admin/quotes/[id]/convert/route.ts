import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, generateOrderNumber, generateWorkOrderNumber } from "@/lib/order-numbers";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const quote=await prisma.quote.findUnique({
    where:{id},
    include:{items:{orderBy:{sortOrder:"asc"}},invoices:{where:{status:{not:"VOID"}},take:1},design:{select:{productId:true}}},
  });
  if(!quote) return NextResponse.json({error:"Quote not found."},{status:404});
  if(quote.convertedOrderId){
    return NextResponse.json({ok:true,orderId:quote.convertedOrderId,alreadyConverted:true});
  }
  if(quote.status!=="ACCEPTED"){
    return NextResponse.json({error:"Mark the quote Accepted before converting it into a job."},{status:409});
  }
  if(quote.total<=0 || !quote.items.length){
    return NextResponse.json({error:"Add priced line items before converting this quote."},{status:409});
  }

  const product=await prisma.product.upsert({
    where:{slug:"custom-quoted-job"},
    update:{active:true},
    create:{
      name:"Custom Quoted Job",
      slug:"custom-quoted-job",
      category:"Custom Production",
      description:"Custom production work created from an approved quote.",
      basePrice:0,
      colors:["Custom"],
      sizes:["Quoted specification"],
      images:["/mockups/category-signage.webp"],
      active:true,
    },
  });

  const dueDate=quote.validUntil ?? null;
  const order=await prisma.$transaction(async(tx)=>{
    const created=await tx.order.create({
      data:{
        orderNumber:generateOrderNumber(),
        customerId:quote.customerId,
        customerEmail:quote.customerEmail,
        customerName:quote.customerName,
        customerPhone:quote.customerPhone,
        notes:`Converted from ${quote.quoteNumber}.\n${quote.details}`,
        status:"PENDING_PAYMENT",
        paymentStatus:"UNPAID",
        subtotal:quote.subtotal,
        total:quote.total,
        currency:quote.currency,
        items:{create:quote.items.map((item,index)=>({
          productId:index===0 && quote.design?.productId ? quote.design.productId : product.id,
          designId:index===0 ? quote.designId : null,
          size:"Quoted specification",
          color:"Custom",
          quantity:item.quantity,
          unitPrice:item.unitPrice,
          lineTotal:item.lineTotal,
        }))},
        workOrders:{create:{
          workOrderNumber:generateWorkOrderNumber(),
          stage:"APPROVED",
          dueDate,
          notes:`Approved quote ${quote.quoteNumber}: ${quote.jobType}`,
          events:{create:{
            toStage:"APPROVED",
            note:`Created from accepted quote ${quote.quoteNumber}; awaiting payment/queueing.`,
            changedBy:session.user.email ?? session.user.name ?? "Admin",
          }},
        }},
      },
    });

    const existingInvoice=quote.invoices[0];
    if(existingInvoice){
      if(existingInvoice.amountPaid>0 && existingInvoice.total!==quote.total){
        throw new Error("This quote changed after a payment was recorded. Reconcile the invoice before conversion.");
      }
      await tx.invoiceItem.deleteMany({where:{invoiceId:existingInvoice.id}});
      const nextBalance=Math.max(0,quote.total-existingInvoice.amountPaid);
      const nextStatus=nextBalance===0 && quote.total>0
        ? "PAID"
        : existingInvoice.amountPaid>0
          ? "PARTIAL"
          : existingInvoice.status;
      await tx.invoice.update({
        where:{id:existingInvoice.id},
        data:{
          orderId:created.id,
          subtotal:quote.subtotal,
          tax:quote.tax,
          total:quote.total,
          balance:nextBalance,
          status:nextStatus,
          items:{create:quote.items.map(item=>({
            description:item.description,quantity:item.quantity,unitPrice:item.unitPrice,lineTotal:item.lineTotal,sortOrder:item.sortOrder,
          }))},
        },
      });
    }else{
      const invoiceDue=new Date(); invoiceDue.setDate(invoiceDue.getDate()+14);
      await tx.invoice.create({
        data:{
          invoiceNumber:generateInvoiceNumber(),
          customerId:quote.customerId,
          quoteId:quote.id,
          orderId:created.id,
          status:"SENT",
          issueDate:new Date(),
          dueDate:invoiceDue,
          subtotal:quote.subtotal,
          tax:quote.tax,
          total:quote.total,
          amountPaid:0,
          balance:quote.total,
          currency:quote.currency,
          notes:quote.notes,
          items:{create:quote.items.map(item=>({
            description:item.description,quantity:item.quantity,unitPrice:item.unitPrice,lineTotal:item.lineTotal,sortOrder:item.sortOrder,
          }))},
        },
      });
    }

    await tx.quote.update({where:{id},data:{status:"CONVERTED",convertedOrderId:created.id}});
    return created;
  });

  return NextResponse.json({ok:true,orderId:order.id,orderNumber:order.orderNumber});
}
