import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema=z.object({
  status:z.enum(["APPROVED","CHANGES_REQUESTED","REJECTED"]),
  note:z.string().trim().max(3000).optional(),
});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid approval update."},{status:400});
  const {id}=await params;
  const design=await prisma.design.findUnique({
    where:{id},
    include:{orderItems:{include:{order:{include:{workOrders:true}}}}},
  });
  if(!design)return NextResponse.json({error:"Design not found."},{status:404});

  const actor=session.user.email??session.user.name??"Admin";
  const now=new Date();

  const updated=await prisma.$transaction(async(tx)=>{
    const saved=await tx.design.update({
      where:{id},
      data:{
        approvalStatus:parsed.data.status,
        approvalNote:parsed.data.note||null,
        approvedAt:parsed.data.status==="APPROVED"?now:null,
        approvedBy:parsed.data.status==="APPROVED"?actor:null,
      },
    });

    for(const item of design.orderItems){
      for(const job of item.order.workOrders){
        if(parsed.data.status==="APPROVED" && job.stage==="REVIEW"){
          await tx.workOrder.update({where:{id:job.id},data:{stage:"APPROVED",blockedReason:null}});
          await tx.workOrderEvent.create({
            data:{workOrderId:job.id,fromStage:"REVIEW",toStage:"APPROVED",note:"Artwork approved for production.",changedBy:actor},
          });
        }
        if(parsed.data.status==="CHANGES_REQUESTED" && ["REVIEW","APPROVED"].includes(job.stage)){
          await tx.workOrder.update({where:{id:job.id},data:{stage:"ON_HOLD",blockedReason:"Artwork changes requested"}});
          await tx.workOrderEvent.create({
            data:{workOrderId:job.id,fromStage:job.stage,toStage:"ON_HOLD",note:parsed.data.note||"Artwork changes requested.",changedBy:actor},
          });
        }
      }
    }
    return saved;
  });

  return NextResponse.json({ok:true,design:updated});
}
