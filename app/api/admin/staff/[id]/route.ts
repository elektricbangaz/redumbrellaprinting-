import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  jobTitle: z.string().trim().max(120).nullable().optional(),
  hourlyRateJmd: z.number().min(0).max(1000000).optional(),
  active: z.boolean().optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid staff update." }, { status: 400 });
  const { id } = await params;
  if ((parsed.data.active !== undefined || parsed.data.role !== undefined) && role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required for role or status changes." }, { status: 403 });
  }
  try {
    await prisma.adminUser.update({
      where: { id },
      data: {
        ...(parsed.data.jobTitle !== undefined ? { jobTitle: parsed.data.jobTitle || null } : {}),
        ...(parsed.data.hourlyRateJmd !== undefined ? { hourlyRate: Math.round(parsed.data.hourlyRateJmd * 100) } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update staff." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  if (session.user.id === id) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 409 });
  const now=new Date();
  await prisma.$transaction(async(tx)=>{
    await tx.adminUser.update({ where: { id }, data: { active: false } });
    const open=await tx.staffClockEntry.findMany({where:{staffId:id,clockOut:null}});
    for(const entry of open){
      const durationMinutes=Math.max(1,Math.round((now.getTime()-entry.clockIn.getTime())/60000));
      await tx.staffClockEntry.update({where:{id:entry.id},data:{clockOut:now,durationMinutes}});
    }
  });
  return NextResponse.json({ ok: true });
}
