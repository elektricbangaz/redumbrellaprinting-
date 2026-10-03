import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().trim().min(2).max(120), area: z.string().trim().max(120).optional() });

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a workstation name." }, { status: 400 });
  try {
    const workstation = await prisma.workstation.create({ data: { name: parsed.data.name, area: parsed.data.area || null } });
    return NextResponse.json({ ok: true, workstation });
  } catch {
    return NextResponse.json({ error: "A workstation with that name already exists." }, { status: 409 });
  }
}
