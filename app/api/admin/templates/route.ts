import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema=z.object({
  designId:z.string(),
  name:z.string().trim().min(2).max(160),
  description:z.string().trim().max(1000).optional(),
});

export async function POST(req:Request){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a design and template name."},{status:400});
  const design=await prisma.design.findUnique({where:{id:parsed.data.designId}});
  if(!design)return NextResponse.json({error:"Design not found."},{status:404});
  const template=await prisma.designTemplate.create({
    data:{
      name:parsed.data.name,
      description:parsed.data.description||null,
      productId:design.productId,
      canvasData:design.canvasData,
      previewImage:design.previewImage,
      active:true,
    },
  });
  return NextResponse.json({ok:true,template});
}
