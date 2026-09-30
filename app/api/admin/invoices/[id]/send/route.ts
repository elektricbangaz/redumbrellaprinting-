import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { formatJMD } from "@/lib/money";

function publicBase(){return process.env.PUBLIC_APP_URL || "https://www.redumbrellaprinting.com";}

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const session=await auth();if(!session?.user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params;
 const invoice=await prisma.invoice.findUnique({where:{id},include:{customer:true}});
 if(!invoice)return NextResponse.json({error:"Invoice not found."},{status:404});
 const resend=getResendClient();if(!resend)return NextResponse.json({error:"Email delivery is not configured."},{status:503});
 const url=`${publicBase()}/i/${invoice.publicToken}`;
 const html=`<div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:620px;margin:auto;color:#111827">
  <p style="font-size:12px;letter-spacing:.12em;color:#d20d14;font-weight:800">RED UMBRELLA PRINTING</p>
  <h1 style="font-size:28px;margin:8px 0">Invoice ${invoice.invoiceNumber}</h1>
  <p>Hello ${invoice.customer.name||"there"},</p>
  <p>Your current balance is <strong>${formatJMD(invoice.balance)}</strong>.</p>
  <p><a href="${url}" style="display:inline-block;background:#d20d14;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700">View invoice</a></p>
 </div>`;
 await resend.emails.send({from:FROM_EMAIL,to:invoice.customer.email,subject:`Red Umbrella invoice ${invoice.invoiceNumber}`,html});
 const status=invoice.status==="DRAFT"?"SENT":invoice.status;
 await prisma.invoice.update({where:{id},data:{status}});
 return NextResponse.json({ok:true,url});
}
