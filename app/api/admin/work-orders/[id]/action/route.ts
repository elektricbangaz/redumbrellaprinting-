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

const productionStages = new Set(["APPROVED", "QUEUED", "IN_PROGRESS", "QUALITY_CHECK"]);

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
      const job = await tx.workOrder.findUnique({
        where: { id },
        include: { order: { select: { paymentStatus: true } } },
      });
      if (!job) return { error: "Job not found.", status: 404 as const };

      const action = parsed.data.action;
      if (!productionStages.has(job.stage) && action !== "PROGRESS") {
        return { error: "This job is not in a production-ready stage.", status: 409 as const };
      }

      const requiresPaid = ["START", "RESUME", "MOVE_PHASE", "MARK_QC", "MARK_READY", "COMPLETE"].includes(action);
      if (requiresPaid && job.order.paymentStatus !== "PAID") {
        return { error: "Record payment before advancing this job through production.", status: 409 as const };
      }

      async function closeStaffSessions() {
        const active = await tx.productionSession.findMany({ where: { staffId: staff.id, active: true } });
        for (const item of active) {
          const minutes = Math.max(1, Math.round((now.getTime() - item.startedAt.getTime()) / 60000));
          await tx.productionSession.update({
            where: { id: item.id },
            data: { active: false, endedAt: now, durationMinutes: item.durationMinutes + minutes },
          });
        }
      }

      async function closeJobSessions() {
        const active = await tx.productionSession.findMany({ where: { workOrderId: job.id, active: true } });
        for (const item of active) {
          const minutes = Math.max(1, Math.round((now.getTime() - item.startedAt.getTime()) / 60000));
          await tx.productionSession.update({
            where: { id: item.id },
            data: { active: false, endedAt: now, durationMinutes: item.durationMinutes + minutes },
          });
        }
      }

      if (action === "START" || action === "RESUME") {
        if (!["APPROVED", "QUEUED", "IN_PROGRESS"].includes(job.stage)) {
          return { error: "Only approved, queued, or active jobs can be started.", status: 409 as const };
        }
        await closeStaffSessions();
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
          data: {
            workOrderId: job.id,
            fromStage: job.stage,
            toStage: "IN_PROGRESS",
            changedBy: staff.name,
            note: action === "START" ? "Production started." : "Production resumed.",
          },
        });
      }

      if (action === "PAUSE") {
        if (job.stage !== "IN_PROGRESS") return { error: "Only active production jobs can be paused.", status: 409 as const };
        await closeJobSessions();
        await tx.workOrder.update({ where: { id: job.id }, data: { lastWorkedBy: staff.name } });
        await tx.workOrderEvent.create({
          data: { workOrderId: job.id, fromStage: job.stage, toStage: job.stage, changedBy: staff.name, note: "Production paused." },
        });
      }

      if (action === "PROGRESS") {
        if (job.stage !== "IN_PROGRESS") return { error: "Progress can only be updated while a job is in production.", status: 409 as const };
        const progress = parsed.data.progress ?? job.progress;
        await tx.workOrder.update({ where: { id: job.id }, data: { progress, lastWorkedBy: staff.name } });
        await tx.workOrderEvent.create({
          data: { workOrderId: job.id, fromStage: job.stage, toStage: job.stage, changedBy: staff.name, note: "Progress updated to " + progress + "%." },
        });
      }

      if (action === "MOVE_PHASE") {
        if (!["APPROVED", "QUEUED", "IN_PROGRESS"].includes(job.stage)) {
          return { error: "This job cannot move to another production phase yet.", status: 409 as const };
        }
        const phase = parsed.data.phase;
        if (!phase) return { error: "Choose a production phase.", status: 400 as const };
        if (job.stage !== "IN_PROGRESS") {
          await closeStaffSessions();
          await tx.productionSession.create({ data: { workOrderId: job.id, staffId: staff.id, startedAt: now } });
        }
        await tx.workOrder.update({
          where: { id: job.id },
          data: { stage: "IN_PROGRESS", productionPhase: phase, lastWorkedBy: staff.name, startedAt: job.startedAt ?? now },
        });
        await tx.order.update({ where: { id: job.orderId }, data: { status: "IN_PRODUCTION" } });
        await tx.workOrderEvent.create({
          data: { workOrderId: job.id, fromStage: job.stage, toStage: "IN_PROGRESS", changedBy: staff.name, note: "Moved to " + phase.replaceAll("_", " ").toLowerCase() + "." },
        });
      }

      if (action === "MARK_QC") {
        if (job.stage !== "IN_PROGRESS") return { error: "Only an in-production job can move to quality check.", status: 409 as const };
        await closeJobSessions();
        await tx.workOrder.update({ where: { id: job.id }, data: { stage: "QUALITY_CHECK", lastWorkedBy: staff.name } });
        await tx.workOrderEvent.create({
          data: { workOrderId: job.id, fromStage: job.stage, toStage: "QUALITY_CHECK", changedBy: staff.name, note: "Sent to quality check." },
        });
      }

      if (action === "MARK_READY") {
        if (job.stage !== "QUALITY_CHECK") return { error: "Quality check must be completed before marking a job ready.", status: 409 as const };
        await closeJobSessions();
        await tx.workOrder.update({ where: { id: job.id }, data: { stage: "READY", progress: 100, lastWorkedBy: staff.name } });
        await tx.order.update({ where: { id: job.orderId }, data: { status: "READY_FOR_PICKUP" } });
        await tx.workOrderEvent.create({
          data: { workOrderId: job.id, fromStage: job.stage, toStage: "READY", changedBy: staff.name, note: "Job marked ready for pickup or delivery." },
        });
      }

      if (action === "COMPLETE") {
        if (job.stage !== "READY") return { error: "Only ready jobs can be completed.", status: 409 as const };
        await closeJobSessions();
        await tx.workOrder.update({
          where: { id: job.id },
          data: { stage: "COMPLETED", progress: 100, completedAt: now, lastWorkedBy: staff.name },
        });
        await tx.order.update({ where: { id: job.orderId }, data: { status: "COMPLETED" } });
        await tx.workOrderEvent.create({
          data: { workOrderId: job.id, fromStage: job.stage, toStage: "COMPLETED", changedBy: staff.name, note: "Job completed." },
        });
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
