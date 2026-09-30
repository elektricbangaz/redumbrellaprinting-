import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema=z.object({decision:z.enum(["ACCEPTED","DECLINED"])});

export async function POST(req:Request,{params}:{params:Promise<{token:string}>}){
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid response."},{status:400});
  const {token}=await params;
  const quote=await prisma.quote.findUnique({where:{publicToken:token}});
  if(!quote)return NextResponse.json({error:"Quote not found."},{status:404});
  if(["CONVERTED","CANCELLED"].includes(quote.status)){
    return NextResponse.json({error:"This quote can no longer be changed."},{status:409});
  }
  if(quote.validUntil && quote.validUntil<new Date()){
    await prisma.quote.update({where:{id:quote.id},data:{status:"EXPIRED"}});
    return NextResponse.json({error:"This quote has expired."},{status:409});
  }
  const updated=await prisma.quote.update({where:{id:quote.id},data:{status:parsed.data.decision}});
  return NextResponse.json({ok:true,status:updated.status});
}
