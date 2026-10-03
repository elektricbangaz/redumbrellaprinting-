import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  staffId: z.string().min(1),
  workstationId: z.string().nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Complete the shift details." }, { status: 400 });
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt) return NextResponse.json({ error: "Shift end must be after shift start." }, { status: 400 });

  const conflict = await prisma.staffShift.findFirst({
    where: {
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      OR: [
        { staffId: parsed.data.staffId },
        ...(parsed.data.workstationId ? [{ workstationId: parsed.data.workstationId }] : []),
      ],
    },
    include: { staff: true, workstation: true },
  });
  if (conflict) {
    return NextResponse.json({
      error: conflict.staffId === parsed.data.staffId
        ? `${conflict.staff.name} already has an overlapping shift.`
        : `${conflict.workstation?.name || "That workstation"} is already assigned during this time.`,
    }, { status: 409 });
  }

  const shift = await prisma.staffShift.create({
    data: {
      staffId: parsed.data.staffId,
      workstationId: parsed.data.workstationId || null,
      startsAt,
      endsAt,
      notes: parsed.data.notes || null,
    },
  });
  return NextResponse.json({ ok: true, shift });
}
