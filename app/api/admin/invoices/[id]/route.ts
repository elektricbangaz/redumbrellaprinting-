import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema=z.object({
  status:z.enum(["DRAFT","SENT","PARTIAL","PAID","OVERDUE","VOID"]).optional(),
  dueDate:z.string().nullable().optional(),
  notes:z.string().max(5000).nullable().optional(),
  amountPaidJmd:z.number().min(0).max(100000000).optional(),
});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Invalid invoice update."},{status:400});
  const {id}=await params;
  const existing=await prisma.invoice.findUnique({where:{id}});
  if(!existing) return NextResponse.json({error:"Invoice not found."},{status:404});

  let amountPaid=parsed.data.amountPaidJmd!==undefined?Math.round(parsed.data.amountPaidJmd*100):existing.amountPaid;
  if(parsed.data.status==="PAID") amountPaid=existing.total;
  amountPaid=Math.min(existing.total,Math.max(0,amountPaid));
  const balance=Math.max(0,existing.total-amountPaid);
  let status=parsed.data.status ?? existing.status;
  if(status!=="VOID"){
    if(balance===0 && existing.total>0) status="PAID";
    else if(amountPaid>0) status="PARTIAL";
  }

  const invoice=await prisma.$transaction(async(tx)=>{
    const updated=await tx.invoice.update({
      where:{id},
      data:{
        status,
        amountPaid,
        balance,
        ...(parsed.data.dueDate!==undefined?{dueDate:parsed.data.dueDate?new Date(parsed.data.dueDate):null}:{}),
        ...(parsed.data.notes!==undefined?{notes:parsed.data.notes}:{}),
      },
    });

    if(updated.orderId && status==="PAID"){
      const order=await tx.order.findUnique({where:{id:updated.orderId}});
      if(order){
        const terminal=["IN_PRODUCTION","READY_FOR_PICKUP","COMPLETED"].includes(order.status);
        await tx.order.update({
          where:{id:order.id},
          data:{paymentStatus:"PAID",...(terminal?{}:{status:"PAID"})},
        });
        const jobs=await tx.workOrder.findMany({where:{orderId:order.id}});
        for(const job of jobs){
          if(job.stage==="APPROVED"){
            await tx.workOrder.update({where:{id:job.id},data:{stage:"QUEUED"}});
            await tx.workOrderEvent.create({
              data:{
                workOrderId:job.id,fromStage:"APPROVED",toStage:"QUEUED",
                note:"Invoice paid; job released to production queue.",
                changedBy:session.user.email ?? session.user.name ?? "Admin",
              },
            });
          }else{
            await tx.workOrderEvent.create({
              data:{
                workOrderId:job.id,fromStage:job.stage,toStage:job.stage,
                note:"Invoice marked paid.",
                changedBy:session.user.email ?? session.user.name ?? "Admin",
              },
            });
          }
        }
      }
    }
    return updated;
  });
  return NextResponse.json({ok:true,invoice});
}
