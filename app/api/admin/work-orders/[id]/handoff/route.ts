import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema=z.object({
  fulfillmentMethod:z.enum(["PICKUP","DELIVERY"]),
  trackingNumber:z.string().trim().max(200).optional(),
  note:z.string().trim().max(1000).optional(),
});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid handoff update."},{status:400});
  const {id}=await params;
  const job=await prisma.workOrder.findUnique({where:{id},include:{order:true}});
  if(!job)return NextResponse.json({error:"Job not found."},{status:404});
  if(job.stage!=="READY" && job.stage!=="COMPLETED"){
    return NextResponse.json({error:"Only ready jobs can be handed off."},{status:409});
  }

  const actor=session.user.email??session.user.name??"Admin";
  const now=new Date();
  const updated=await prisma.$transaction(async(tx)=>{
    const saved=await tx.workOrder.update({
      where:{id},
      data:{
        stage:"COMPLETED",
        fulfillmentMethod:parsed.data.fulfillmentMethod,
        trackingNumber:parsed.data.trackingNumber||null,
        handoffAt:now,
        handoffBy:actor,
        completedAt:job.completedAt??now,
        progress:100,
      },
    });
    await tx.workOrderEvent.create({
      data:{
        workOrderId:id,
        fromStage:job.stage,
        toStage:"COMPLETED",
        note:parsed.data.note||`Job handed off by ${parsed.data.fulfillmentMethod.toLowerCase()}.`,
        changedBy:actor,
      },
    });
    const remaining=await tx.workOrder.count({where:{orderId:job.orderId,stage:{not:"COMPLETED"}}});
    if(remaining===0){
      await tx.order.update({where:{id:job.orderId},data:{status:"COMPLETED"}});
    }
    return saved;
  });

  return NextResponse.json({ok:true,job:updated});
}
