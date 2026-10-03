import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { planWorkOrderMaterials, releaseWorkOrderMaterials } from "@/lib/production-materials";
import { sendCustomerEvent } from "@/lib/notifications";

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
    include:{customer:true,product:true,orderItems:{include:{order:{include:{workOrders:true}}}}},
  });
  if(!design)return NextResponse.json({error:"Design not found."},{status:404});

  const actor=session.user.email??session.user.name??"Admin";
  const now=new Date();
  const updated=await prisma.$transaction(async(tx)=>{
    const saved=await tx.design.update({
      where:{id},
      data:{
        approvalStatus:parsed.data.status,
        status:parsed.data.status==="REJECTED"?"CANCELLED":design.status,
        approvalNote:parsed.data.note||null,
        approvedAt:parsed.data.status==="APPROVED"?now:null,
        approvedBy:parsed.data.status==="APPROVED"?actor:null,
      },
    });
    for(const item of design.orderItems){
      for(const job of item.order.workOrders){
        if(parsed.data.status==="APPROVED" && ["REVIEW","NEEDS_CUSTOMER_APPROVAL","ON_HOLD"].includes(job.stage)){
          const nextStage=item.order.paymentStatus==="PAID"?"QUEUED":"APPROVED";
          await tx.workOrder.update({where:{id:job.id},data:{stage:nextStage,blockedReason:null}});
          if(nextStage==="QUEUED") await planWorkOrderMaterials(tx,job.id);
          await tx.workOrderEvent.create({data:{workOrderId:job.id,fromStage:job.stage,toStage:nextStage,note:nextStage==="QUEUED"?"Artwork approved and paid job released to production queue.":"Artwork approved for production; awaiting payment.",changedBy:actor}});
        }
        if(parsed.data.status==="CHANGES_REQUESTED" && ["REVIEW","APPROVED","NEEDS_CUSTOMER_APPROVAL"].includes(job.stage)){
          await tx.workOrder.update({where:{id:job.id},data:{stage:"ON_HOLD",blockedReason:"Artwork changes requested"}});
          await releaseWorkOrderMaterials(tx,job.id);
          await tx.workOrderEvent.create({data:{workOrderId:job.id,fromStage:job.stage,toStage:"ON_HOLD",note:parsed.data.note||"Artwork changes requested.",changedBy:actor}});
        }
        if(parsed.data.status==="REJECTED" && !["COMPLETED","CANCELLED"].includes(job.stage)){
          await tx.workOrder.update({where:{id:job.id},data:{stage:"CANCELLED",blockedReason:"Artwork rejected"}});
          await releaseWorkOrderMaterials(tx,job.id);
          await tx.workOrderEvent.create({data:{workOrderId:job.id,fromStage:job.stage,toStage:"CANCELLED",note:parsed.data.note||"Artwork rejected.",changedBy:actor}});
        }
      }
    }
    return saved;
  });

  if(design.customer){
    const human=parsed.data.status==="APPROVED"?"approved":parsed.data.status==="CHANGES_REQUESTED"?"needs changes":"was not approved";
    try { await sendCustomerEvent({
      event:`DESIGN_${parsed.data.status}`,entityType:"Design",entityId:design.id,
      email:design.customer.email,phone:design.customer.phone,
      emailSubject:`Design update — ${design.product.name}`,
      message:`Your Red Umbrella Printing design for ${design.product.name} ${human}.${parsed.data.note?`\n\nNote: ${parsed.data.note}`:""}`,
      whatsappTemplate:process.env.WHATSAPP_TEMPLATE_DESIGN_UPDATE,
      whatsappParams:[design.customer.name||"Customer",design.product.name,human],
    }); } catch(error) { console.error("[notification] design update failed",error); }
  }
  return NextResponse.json({ok:true,design:updated});
}
