import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema=z.object({
  delta:z.number().min(-100000000).max(100000000),
  type:z.enum(["RECEIPT","USAGE","ADJUSTMENT","WASTE","RETURN"]),
  note:z.string().trim().max(1000).optional(),
  reorderLevel:z.number().min(0).max(100000000).optional(),
});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid stock adjustment."},{status:400});
  const {id}=await params;
  const current=await prisma.inventoryItem.findUnique({where:{id}});
  if(!current)return NextResponse.json({error:"Inventory item not found."},{status:404});
  const next=current.quantity+parsed.data.delta;
  if(next<0)return NextResponse.json({error:"This adjustment would make stock negative."},{status:409});

  const item=await prisma.$transaction(async(tx)=>{
    const updated=await tx.inventoryItem.update({
      where:{id},
      data:{quantity:next,...(parsed.data.reorderLevel!==undefined?{reorderLevel:parsed.data.reorderLevel}:{})},
    });
    if(parsed.data.delta!==0){
      await tx.inventoryMovement.create({
        data:{
          inventoryItemId:id,type:parsed.data.type,quantity:parsed.data.delta,note:parsed.data.note||null,
          changedBy:session.user.email??session.user.name??"Admin",
        },
      });
    }
    return updated;
  });
  return NextResponse.json({ok:true,item});
}
