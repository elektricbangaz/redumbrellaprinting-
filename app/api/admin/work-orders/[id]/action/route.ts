import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  action: z.enum(["START", "PAUSE", "RESUME", "PROGRESS", "MOVE_PHASE", "MARK_QC", "MARK_READY", "COMPLETE"]),
  progress: z.number().int().min(0).max(100).optional(),
  phase: z.enum(["PRE_PRESS", "PRINTING", "FINISHING"]).optional(),
  machine: z.string().trim().max(120).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid production update." }, { status: 400 });
  const { id } = await params;
  const staff = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
  if (!staff) return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.workOrder.findUnique({ where: { id }, include: { order: { select: { paymentStatus: true } } } });
      if (!job) return { error: "Job not found.", status: 404 as const };
      const action = parsed.data.action;

      async function closeSessions(scopeWorkOrderId?: string) {
        const active = await tx.productionSession.findMany({
          where: { staffId: staff.id, active: true, ...(scopeWorkOrderId ? { workOrderId: scopeWorkOrderId } : {}) },
        });
        for (const item of active) {
          const minutes = Math.max(1, Math.round((now.getTime() - item.startedAt.getTime()) / 60000));
          await tx.productionSession.update({
            where: { id: item.id },
            data: { active: false, endedAt: now, durationMinutes: item.durationMinutes + minutes },
          });
        }
      }

      if (action === "START" || action === "RESUME") {
        if (job.order.paymentStatus !== "PAID") return { error: "Record payment before starting production.", status: 409 as const };
        await closeSessions();
        await tx.productionSession.create({ data: { workOrderId: job.id, staffId: staff.id, startedAt: now } });
        const nextPhase = parsed.data.phase ?? job.productionPhase ?? "PRE_PRESS";
        await tx.workOrder.update({
          where: { id: job.id },
          data: {
            stage: "IN_PROGRESS",
            productionPhase: nextPhase,
            lastWorkedBy: staff.name,
            startedAt: job.startedAt ?? now,
            ...(parsed.data.machine ? { machine: parsed.data.machine } : {}),
          },
        });
        await tx.order.update({ where: { id: job.orderId }, data: { status: "IN_PRODUCTION" } });
        await tx.workOrderEvent.create({
          data: { workOrderId: job.id, fromStage: job.stage, toStage: "IN_PROGRESS", changedBy: staff.name, note: action === "START" ? "Production started." : "Production resumed." },
        });
      }

      if (action === "PAUSE") {
        await closeSessions(job.id);
        await tx.workOrder.update({ where: { id: job.id }, data: { lastWorkedBy: staff.name } });
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: job.stage, toStage: job.stage, changedBy: staff.name, note: "Production paused." } });
      }

      if (action === "PROGRESS") {
        const progress = parsed.data.progress ?? job.progress;
        await tx.workOrder.update({ where: { id: job.id }, data: { progress, lastWorkedBy: staff.name } });
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: job.stage, toStage: job.stage, changedBy: staff.name, note: "Progress updated to " + progress + "%." } });
      }

      if (action === "MOVE_PHASE") {
        const phase = parsed.data.phase;
        if (!phase) return { error: "Choose a production phase.", status: 400 as const };
        await tx.workOrder.update({ where: { id: job.id }, data: { stage: "IN_PROGRESS", productionPhase: phase, lastWorkedBy: staff.name } });
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: job.stage, toStage: "IN_PROGRESS", changedBy: staff.name, note: "Moved to " + phase.replaceAll("_", " ").toLowerCase() + "." } });
      }

      if (action === "MARK_QC") {
        await closeSessions(job.id);
        await tx.workOrder.update({ where: { id: job.id }, data: { stage: "QUALITY_CHECK", lastWorkedBy: staff.name } });
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: job.stage, toStage: "QUALITY_CHECK", changedBy: staff.name, note: "Sent to quality check." } });
      }

      if (action === "MARK_READY") {
        await closeSessions(job.id);
        await tx.workOrder.update({ where: { id: job.id }, data: { stage: "READY", progress: 100, lastWorkedBy: staff.name } });
        await tx.order.update({ where: { id: job.orderId }, data: { status: "READY_FOR_PICKUP" } });
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: job.stage, toStage: "READY", changedBy: staff.name, note: "Job marked ready for pickup or delivery." } });
      }

      if (action === "COMPLETE") {
        await closeSessions(job.id);
        await tx.workOrder.update({ where: { id: job.id }, data: { stage: "COMPLETED", progress: 100, completedAt: now, lastWorkedBy: staff.name } });
        await tx.order.update({ where: { id: job.orderId }, data: { status: "COMPLETED" } });
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: job.stage, toStage: "COMPLETED", changedBy: staff.name, note: "Job completed." } });
      }

      return { ok: true };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Production action failed:", error);
    return NextResponse.json({ error: "Could not update production. Please try again." }, { status: 500 });
  }
}
