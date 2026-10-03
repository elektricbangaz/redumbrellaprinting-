import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  workstationId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid time-clock action." }, { status: 400 });
  const staff = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
  if (!staff || !staff.active) return NextResponse.json({ error: "Active staff account required." }, { status: 403 });
  const now = new Date();
  const open = await prisma.staffClockEntry.findFirst({ where: { staffId: staff.id, clockOut: null }, orderBy: { clockIn: "desc" } });

  if (parsed.data.action === "CLOCK_IN") {
    if (open) return NextResponse.json({ error: "You are already clocked in." }, { status: 409 });
    if (parsed.data.workstationId) {
      const station = await prisma.workstation.findFirst({ where: { id: parsed.data.workstationId, active: true } });
      if (!station) return NextResponse.json({ error: "Workstation not found." }, { status: 404 });
    }
    const entry = await prisma.staffClockEntry.create({
      data: { staffId: staff.id, workstationId: parsed.data.workstationId || null, clockIn: now },
    });
    return NextResponse.json({ ok: true, entry });
  }

  if (!open) return NextResponse.json({ error: "You are not currently clocked in." }, { status: 409 });
  const durationMinutes = Math.max(1, Math.round((now.getTime() - open.clockIn.getTime()) / 60000));
  const entry = await prisma.staffClockEntry.update({
    where: { id: open.id },
    data: { clockOut: now, durationMinutes },
  });
  return NextResponse.json({ ok: true, entry });
}
