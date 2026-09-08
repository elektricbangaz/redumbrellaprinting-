import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const stage = body.stage;

  const allowed = ["QUEUED", "IN_PROGRESS", "QUALITY_CHECK", "COMPLETED"];
  if (!allowed.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { stage, assignedTo: body.assignedTo || undefined },
  });
  return NextResponse.json({ ok: true, workOrder });
}
