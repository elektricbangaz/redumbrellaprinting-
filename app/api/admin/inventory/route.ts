import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema=z.object({
  sku:z.string().trim().min(1).max(80),
  name:z.string().trim().min(2).max(160),
  category:z.string().trim().min(1).max(100),
  unit:z.string().trim().min(1).max(40).default("unit"),
  quantity:z.number().min(0).max(100000000).default(0),
  reorderLevel:z.number().min(0).max(100000000).default(0),
  productId:z.string().nullable().optional(),
});

export async function POST(req:Request){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Complete the inventory item fields."},{status:400});
  try{
    const item=await prisma.inventoryItem.create({data:parsed.data});
    if(item.quantity>0){
      await prisma.inventoryMovement.create({
        data:{inventoryItemId:item.id,type:"OPENING",quantity:item.quantity,note:"Opening balance",changedBy:session.user.email??session.user.name??"Admin"},
      });
    }
    return NextResponse.json({ok:true,item});
  }catch(error){
    console.error("[inventory] create failed",error);
    return NextResponse.json({error:"Could not create inventory item. Check that the SKU is unique."},{status:409});
  }
}
