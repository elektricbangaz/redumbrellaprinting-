import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({active:z.boolean().optional(),name:z.string().trim().min(2).max(160).optional(),description:z.string().trim().max(1000).nullable().optional()});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const session=await auth();if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid template update."},{status:400});
 const {id}=await params;
 const template=await prisma.designTemplate.update({where:{id},data:parsed.data});
 return NextResponse.json({ok:true,template});
}
