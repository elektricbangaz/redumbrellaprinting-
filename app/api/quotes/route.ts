import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";
import { generateQuoteNumber } from "@/lib/order-numbers";
import { getBusinessSettings } from "@/lib/business-settings";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  jobType: z.string().trim().min(1),
  quantity: z.string().trim().optional(),
  dimensions: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  details: z.string().trim().min(10),
  artworkUrl: z.string().trim().url().or(z.literal("")).optional(),
  budget: z.string().trim().optional(),
});

function escapeHtml(value: string) {
  return value.replace(/[<>&]/g, (s) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[s] || s));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the required fields.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const q = parsed.data;
  const settings=await getBusinessSettings();
  const validUntil=new Date(); validUntil.setDate(validUntil.getDate()+settings.quoteValidityDays);
  const customer = await prisma.customer.upsert({
    where: { email: q.email },
    update: { name: q.name, phone: q.phone || undefined },
    create: { email: q.email, name: q.name, phone: q.phone || undefined },
  });

  const quoteNumber = generateQuoteNumber();
  const quantity = Math.max(1, Number.parseInt(q.quantity || "1", 10) || 1);
  const itemDescription = [q.jobType, q.dimensions ? `Size: ${q.dimensions}` : ""].filter(Boolean).join(" · ");

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: customer.id,
      source: "WEB",
      status: "REQUESTED",
      customerName: q.name,
      customerEmail: q.email,
      customerPhone: q.phone || null,
      company: q.company || null,
      jobType: q.jobType,
      details: [
        q.details,
        q.dueDate ? `Requested due date: ${q.dueDate}` : "",
      ].filter(Boolean).join("\n"),
      artworkUrl: q.artworkUrl || null,
      budget: q.budget || null,
      validUntil,
      items: {
        create: {
          description: itemDescription,
          quantity,
          unitPrice: 0,
          lineTotal: 0,
          sortOrder: 0,
        },
      },
    },
  });

  const resend = getResendClient();
  if (resend) {
    const lines: Array<[string, string | undefined | null]> = [
      ["Reference", quote.quoteNumber],
      ["Name", q.name],
      ["Email", q.email],
      ["Phone", q.phone],
      ["Company", q.company],
      ["Job type", q.jobType],
      ["Quantity", q.quantity],
      ["Dimensions", q.dimensions],
      ["Needed by", q.dueDate],
      ["Budget", q.budget],
      ["Artwork", q.artworkUrl],
      ["Details", q.details],
    ];
    const html = `<div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:680px"><h2>New Red Umbrella quote request</h2>${lines.map(([k,v]) => v ? `<p><strong>${k}:</strong> ${escapeHtml(String(v))}</p>` : "").join("")}</div>`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: process.env.QUOTE_TO_EMAIL || settings.notificationEmail,
      replyTo: q.email,
      subject: `[${quote.quoteNumber}] ${q.jobType} quote request`,
      html,
    }).catch((error) => console.error("[quotes] email delivery failed", error));
  }

  return NextResponse.json({ ok: true, reference: quote.quoteNumber, quoteId: quote.id });
}
