import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { formatJMD } from "@/lib/money";

function publicBase(){
  return process.env.PUBLIC_APP_URL || "https://www.redumbrellaprinting.com";
}

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const quote=await prisma.quote.findUnique({where:{id},include:{items:{orderBy:{sortOrder:"asc"}}}});
  if(!quote)return NextResponse.json({error:"Quote not found."},{status:404});
  if(quote.total<=0)return NextResponse.json({error:"Price the quote before sending it."},{status:409});
  const resend=getResendClient();
  if(!resend)return NextResponse.json({error:"Email delivery is not configured."},{status:503});
  const url=`${publicBase()}/q/${quote.publicToken}`;
  const html=`<div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:620px;margin:auto;color:#111827">
    <p style="font-size:12px;letter-spacing:.12em;color:#d20d14;font-weight:800">RED UMBRELLA PRINTING</p>
    <h1 style="font-size:28px;margin:8px 0">Your quote is ready.</h1>
    <p>Hello ${quote.customerName},</p>
    <p>Quote <strong>${quote.quoteNumber}</strong> for <strong>${quote.jobType}</strong> is ready for review.</p>
    <p style="font-size:22px;font-weight:800">${formatJMD(quote.total)}</p>
    <p><a href="${url}" style="display:inline-block;background:#d20d14;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700">View & respond to quote</a></p>
    <p style="color:#667085;font-size:12px">You can review the line items, terms and accept or decline online.</p>
  </div>`;
  await resend.emails.send({from:FROM_EMAIL,to:quote.customerEmail,subject:`Red Umbrella quote ${quote.quoteNumber}`,html});
  const status=["REQUESTED","DRAFT","VIEWED"].includes(quote.status)?"SENT":quote.status;
  await prisma.quote.update({where:{id},data:{status}});
  return NextResponse.json({ok:true,url});
}
