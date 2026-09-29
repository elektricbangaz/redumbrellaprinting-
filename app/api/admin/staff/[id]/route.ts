import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  jobTitle: z.string().trim().max(100).nullable().optional(),
  hourlyRateJmd: z.number().min(0).max(100000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as (typeof session.user & { role?: string }) | undefined)?.role;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "ADMIN") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid staff update." }, { status: 400 });

  const { id } = await params;
  const data: { jobTitle?: string | null; hourlyRate?: number } = {};
  if (parsed.data.jobTitle !== undefined) data.jobTitle = parsed.data.jobTitle || null;
  if (parsed.data.hourlyRateJmd !== undefined) data.hourlyRate = Math.round(parsed.data.hourlyRateJmd * 100);

  try {
    await prisma.adminUser.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update staff." }, { status: 500 });
  }
}
