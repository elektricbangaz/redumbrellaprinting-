import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";

const schema=z.object({
 name:z.string().min(2),email:z.string().email(),phone:z.string().optional(),company:z.string().optional(),
 jobType:z.string().min(1),quantity:z.string().optional(),dimensions:z.string().optional(),dueDate:z.string().optional(),
 details:z.string().min(10),artworkUrl:z.string().url().or(z.literal("")).optional(),budget:z.string().optional()
});

export async function POST(req:Request){
 const body=await req.json().catch(()=>null); const parsed=schema.safeParse(body);
 if(!parsed.success) return NextResponse.json({error:"Please complete the required fields."},{status:400});
 const q=parsed.data; const reference=`RUP-Q-${Date.now().toString().slice(-8)}`;
 await prisma.customer.upsert({where:{email:q.email},update:{name:q.name,phone:q.phone},create:{email:q.email,name:q.name,phone:q.phone}});
 const resend=getResendClient();
 if(resend){
   const lines=[["Reference",reference],["Name",q.name],["Email",q.email],["Phone",q.phone],["Company",q.company],["Job type",q.jobType],["Quantity",q.quantity],["Dimensions",q.dimensions],["Needed by",q.dueDate],["Budget",q.budget],["Artwork",q.artworkUrl],["Details",q.details]];
   const html=`<div style="font-family:Arial,sans-serif;max-width:680px"><h2>New Red Umbrella quote request</h2>${lines.map(([k,v])=>v?`<p><strong>${k}:</strong> ${String(v).replace(/[<>&]/g,s=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]!))}</p>`:"").join("")}</div>`;
   await resend.emails.send({from:FROM_EMAIL,to:process.env.QUOTE_TO_EMAIL||"orders@redumbrellaprinting.com",replyTo:q.email,subject:`[${reference}] ${q.jobType} quote request`,html}).catch(()=>null);
 }
 return NextResponse.json({ok:true,reference});
}
