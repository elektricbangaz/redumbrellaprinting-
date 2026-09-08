import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getResendClient, FROM_EMAIL } from "@/lib/resend";

const schema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }
  const { subject, body } = parsed.data;

  const subscribers = await prisma.subscriber.findMany({
    where: { unsubscribedAt: null },
  });

  const resend = getResendClient();
  let sentCount = 0;
  let note: string | undefined;

  if (!resend) {
    note =
      "RESEND_API_KEY is not configured — this broadcast was saved but no emails were sent. Add a key in .env to enable sending.";
  } else if (subscribers.length === 0) {
    note = "No active subscribers to send to.";
  } else {
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111"><h2 style="color:#c91418">${escapeHtml(
      subject
    )}</h2><p>${escapeHtml(body).replaceAll("\n", "<br/>")}</p></div>`;

    for (const batch of chunk(subscribers, 100)) {
      const result = await resend.batch.send(
        batch.map((s) => ({
          from: FROM_EMAIL,
          to: s.email,
          subject,
          html,
        }))
      );
      if (!result.error) sentCount += batch.length;
    }
  }

  const broadcast = await prisma.broadcast.create({
    data: {
      subject,
      body,
      sentAt: sentCount > 0 ? new Date() : null,
      sentCount,
      createdById: (session.user as { id?: string }).id,
    },
  });

  return NextResponse.json({ ok: true, broadcast, note });
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
