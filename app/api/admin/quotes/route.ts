import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateQuoteNumber } from "@/lib/order-numbers";

const schema=z.object({
  name:z.string().trim().min(2),
  email:z.string().trim().email(),
  phone:z.string().trim().optional(),
  company:z.string().trim().optional(),
  jobType:z.string().trim().min(2),
  validUntil:z.string().optional(),
  notes:z.string().trim().max(5000).optional(),
  items:z.array(z.object({
    description:z.string().trim().min(1),
    quantity:z.number().int().min(1).max(100000),
    unitPriceJmd:z.number().min(0).max(100000000),
  })).min(1),
});

export async function POST(req:Request){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Complete the required quote fields.",details:parsed.error.flatten()},{status:400});
  const input=parsed.data;
  const customer=await prisma.customer.upsert({
    where:{email:input.email},
    update:{name:input.name,phone:input.phone||undefined},
    create:{name:input.name,email:input.email,phone:input.phone||undefined},
  });
  const items=input.items.map((item,index)=>{
    const unitPrice=Math.round(item.unitPriceJmd*100);
    return {description:item.description,quantity:item.quantity,unitPrice,lineTotal:unitPrice*item.quantity,sortOrder:index};
  });
  const subtotal=items.reduce((sum,item)=>sum+item.lineTotal,0);
  const quote=await prisma.quote.create({
    data:{
      quoteNumber:generateQuoteNumber(),
      customerId:customer.id,
      source:"ADMIN",
      status:"DRAFT",
      customerName:input.name,
      customerEmail:input.email,
      customerPhone:input.phone||null,
      company:input.company||null,
      jobType:input.jobType,
      details:input.notes||input.jobType,
      notes:input.notes||null,
      validUntil:input.validUntil?new Date(input.validUntil):null,
      subtotal,total:subtotal,
      items:{create:items},
    },
  });
  return NextResponse.json({ok:true,quoteId:quote.id,quoteNumber:quote.quoteNumber});
}
