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

  const amountPaid=parsed.data.amountPaidJmd!==undefined?Math.round(parsed.data.amountPaidJmd*100):existing.amountPaid;
  const balance=Math.max(0,existing.total-amountPaid);
  let status=parsed.data.status ?? existing.status;
  if(status!=="VOID"){
    if(balance===0 && existing.total>0) status="PAID";
    else if(amountPaid>0) status="PARTIAL";
  }

  const invoice=await prisma.invoice.update({
    where:{id},
    data:{
      status,
      amountPaid,
      balance,
      ...(parsed.data.dueDate!==undefined?{dueDate:parsed.data.dueDate?new Date(parsed.data.dueDate):null}:{}),
      ...(parsed.data.notes!==undefined?{notes:parsed.data.notes}:{}),
    },
  });
  return NextResponse.json({ok:true,invoice});
}
