import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const itemSchema=z.object({
  description:z.string().trim().min(1),
  quantity:z.number().int().min(1).max(100000),
  unitPriceJmd:z.number().min(0).max(100000000),
});
const schema=z.object({
  status:z.enum(["REQUESTED","DRAFT","SENT","VIEWED","ACCEPTED","DECLINED","EXPIRED","CONVERTED","CANCELLED"]).optional(),
  validUntil:z.string().nullable().optional(),
  notes:z.string().max(5000).nullable().optional(),
  taxJmd:z.number().min(0).max(100000000).optional(),
  items:z.array(itemSchema).min(1).optional(),
});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Invalid quote update.",details:parsed.error.flatten()},{status:400});
  const {id}=await params;
  const existing=await prisma.quote.findUnique({where:{id}});
  if(!existing) return NextResponse.json({error:"Quote not found."},{status:404});

  const itemData=parsed.data.items?.map((item,index)=>{
    const unitPrice=Math.round(item.unitPriceJmd*100);
    return {description:item.description,quantity:item.quantity,unitPrice,lineTotal:unitPrice*item.quantity,sortOrder:index};
  });
  const subtotal=itemData?.reduce((sum,item)=>sum+item.lineTotal,0) ?? existing.subtotal;
  const tax=parsed.data.taxJmd!==undefined ? Math.round(parsed.data.taxJmd*100) : existing.tax;
  const total=subtotal+tax;

  const quote=await prisma.$transaction(async(tx)=>{
    if(itemData){
      await tx.quoteItem.deleteMany({where:{quoteId:id}});
      await tx.quoteItem.createMany({data:itemData.map(item=>({...item,quoteId:id}))});
    }
    return tx.quote.update({
      where:{id},
      data:{
        ...(parsed.data.status?{status:parsed.data.status}:{}),
        ...(parsed.data.validUntil!==undefined?{validUntil:parsed.data.validUntil?new Date(parsed.data.validUntil):null}:{}),
        ...(parsed.data.notes!==undefined?{notes:parsed.data.notes}:{}),
        subtotal,tax,total,
      },
      include:{items:{orderBy:{sortOrder:"asc"}}},
    });
  });
  return NextResponse.json({ok:true,quote});
}
