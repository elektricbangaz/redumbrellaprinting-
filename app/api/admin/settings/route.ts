import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema=z.object({
  businessName:z.string().trim().min(2).max(160),
  businessEmail:z.string().trim().email(),
  businessPhone:z.string().trim().max(80).optional(),
  businessAddress:z.string().trim().max(500).optional(),
  quoteValidityDays:z.number().int().min(1).max(365),
  invoiceDueDays:z.number().int().min(0).max(365),
  taxPercent:z.number().min(0).max(100),
  notificationEmail:z.string().trim().email(),
});

export async function POST(req:Request){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the settings fields.",details:parsed.error.flatten()},{status:400});

  await prisma.adminSetting.upsert({
    where:{key:"business"},
    update:{value:parsed.data},
    create:{key:"business",value:parsed.data},
  });
  return NextResponse.json({ok:true,settings:parsed.data});
}
