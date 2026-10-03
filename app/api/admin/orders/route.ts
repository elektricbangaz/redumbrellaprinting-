import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, generateOrderNumber, generateWorkOrderNumber } from "@/lib/order-numbers";

const schema=z.object({
  name:z.string().trim().min(2),
  email:z.string().trim().email(),
  phone:z.string().trim().optional(),
  description:z.string().trim().min(2),
  quantity:z.number().int().min(1).max(100000),
  unitPriceJmd:z.number().min(0).max(100000000),
  dueDate:z.string().optional(),
  priority:z.enum(["LOW","NORMAL","HIGH","URGENT"]).default("NORMAL"),
  productionMethod:z.string().trim().optional(),
  placement:z.string().trim().optional(),
  notes:z.string().trim().max(5000).optional(),
  paid:z.boolean().default(false),
});

export async function POST(req:Request){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const changedBy=session.user.email??session.user.name??"Admin";
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Complete the required job fields.",details:parsed.error.flatten()},{status:400});
  const input=parsed.data;
  const customer=await prisma.customer.upsert({
    where:{email:input.email},
    update:{name:input.name,phone:input.phone||undefined},
    create:{name:input.name,email:input.email,phone:input.phone||undefined},
  });
  const product=await prisma.product.upsert({
    where:{slug:"counter-production-job"},
    update:{active:true},
    create:{
      name:"Counter Production Job",slug:"counter-production-job",category:"Custom Production",
      description:"Walk-in or manually created production job.",basePrice:0,
      colors:["Custom"],sizes:["Quoted specification"],images:["/android-chrome-512x512.png"],active:true,
    },
  });
  const unitPrice=Math.round(input.unitPriceJmd*100);
  const total=unitPrice*input.quantity;
  const dueDate=input.dueDate?new Date(input.dueDate):null;
  const created=await prisma.$transaction(async(tx)=>{
    const order=await tx.order.create({
      data:{
        orderNumber:generateOrderNumber(),
        customerId:customer.id,
        customerEmail:customer.email,
        customerName:customer.name||input.name,
        customerPhone:customer.phone,
        notes:input.notes||"Created at the admin job counter.",
        status:input.paid?"PAID":"PENDING_PAYMENT",
        paymentStatus:input.paid?"PAID":"UNPAID",
        subtotal:total,total,currency:"JMD",
        items:{create:{
          productId:product.id,size:"Quoted specification",color:"Custom",quantity:input.quantity,unitPrice,lineTotal:total,
        }},
        workOrders:{create:{
          workOrderNumber:generateWorkOrderNumber(),
          stage:input.paid?"QUEUED":"APPROVED",
          priority:input.priority,
          dueDate,
          productionMethod:input.productionMethod||null,
          placement:input.placement||null,
          notes:input.notes||null,
          events:{create:{
            toStage:input.paid?"QUEUED":"APPROVED",
            note:input.paid?"Counter job created and queued.":"Counter job created; awaiting payment before production.",
            changedBy,
          }},
        }},
      },
      include:{workOrders:true},
    });
    const invoice=await tx.invoice.create({
      data:{
        invoiceNumber:generateInvoiceNumber(),
        customerId:customer.id,
        orderId:order.id,
        status:input.paid?"PAID":"SENT",
        issueDate:new Date(),
        dueDate:input.paid?new Date():dueDate||new Date(),
        subtotal:total,tax:0,total,
        amountPaid:input.paid?total:0,
        balance:input.paid?0:total,
        currency:"JMD",
        notes:input.notes||null,
        items:{create:{description:input.description,quantity:input.quantity,unitPrice,lineTotal:total,sortOrder:0}},
      },
    });
    return {order,invoice};
  });
  return NextResponse.json({ok:true,orderId:created.order.id,orderNumber:created.order.orderNumber,invoiceId:created.invoice.id});
}
