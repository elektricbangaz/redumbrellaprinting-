import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const stages = [
  "SUBMITTED", "REVIEW", "NEEDS_CUSTOMER_APPROVAL", "APPROVED", "QUEUED",
  "IN_PROGRESS", "QUALITY_CHECK", "READY", "COMPLETED", "ON_HOLD", "CANCELLED",
] as const;

const transitions: Record<(typeof stages)[number], readonly (typeof stages)[number][]> = {
  SUBMITTED: ["REVIEW", "CANCELLED"],
  REVIEW: ["NEEDS_CUSTOMER_APPROVAL", "APPROVED", "ON_HOLD", "CANCELLED"],
  NEEDS_CUSTOMER_APPROVAL: ["REVIEW", "APPROVED", "ON_HOLD", "CANCELLED"],
  APPROVED: ["QUEUED", "ON_HOLD", "CANCELLED"],
  QUEUED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["QUALITY_CHECK", "ON_HOLD", "CANCELLED"],
  QUALITY_CHECK: ["IN_PROGRESS", "READY", "ON_HOLD", "CANCELLED"],
  READY: ["IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"],
  COMPLETED: [],
  ON_HOLD: ["REVIEW", "NEEDS_CUSTOMER_APPROVAL", "APPROVED", "QUEUED", "IN_PROGRESS", "QUALITY_CHECK", "READY", "CANCELLED"],
  CANCELLED: [],
};

const patchSchema = z.object({
  stage: z.enum(stages).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().trim().max(120).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  productionMethod: z.string().trim().max(120).nullable().optional(),
  placement: z.string().trim().max(160).nullable().optional(),
  blockedReason: z.string().trim().max(1000).nullable().optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const changedBy = session.user.email ?? session.user.name ?? "Staff";

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid job update.", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const { id } = await params;

  if (input.dueDate !== undefined && input.dueDate !== null && (!input.dueDate || Number.isNaN(Date.parse(input.dueDate)))) {
    return NextResponse.json({ error: "Enter a valid due date." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.workOrder.findUnique({ where: { id }, include: { order: { select: { paymentStatus: true } } } });
      if (!current) return { error: "Job not found.", status: 404 as const };
      const nextStage = input.stage ?? current.stage;

      if (input.stage && input.stage !== current.stage && !transitions[current.stage].includes(input.stage)) {
        return { error: `A job cannot move from ${current.stage.replaceAll("_", " ")} to ${input.stage.replaceAll("_", " ")}.`, status: 409 as const };
      }
      if (nextStage === "IN_PROGRESS" && current.order.paymentStatus !== "PAID") {
        return { error: "Record payment before moving this job into production.", status: 409 as const };
      }
      const blockedReason = input.blockedReason === undefined ? current.blockedReason : input.blockedReason || null;
      if (nextStage === "ON_HOLD" && !blockedReason) {
        return { error: "Add a reason before placing a job on hold.", status: 400 as const };
      }

      const workOrder = await tx.workOrder.update({
        where: { id },
        data: {
          ...(input.stage ? { stage: input.stage } : {}),
          ...(input.priority ? { priority: input.priority } : {}),
          ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo || null } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
          ...(input.productionMethod !== undefined ? { productionMethod: input.productionMethod || null } : {}),
          ...(input.placement !== undefined ? { placement: input.placement || null } : {}),
          ...(input.blockedReason !== undefined || nextStage !== current.stage
            ? { blockedReason: nextStage === "ON_HOLD" ? blockedReason : null }
            : {}),
        },
      });

      const detailsChanged = input.priority !== undefined || input.assignedTo !== undefined || input.dueDate !== undefined || input.productionMethod !== undefined || input.placement !== undefined || input.blockedReason !== undefined;
      if (input.stage !== undefined || detailsChanged || input.note) {
        const defaultNote = input.stage && input.stage !== current.stage
          ? `Stage changed from ${current.stage.replaceAll("_", " ")} to ${nextStage.replaceAll("_", " ")}.`
          : "Job details updated.";
        await tx.workOrderEvent.create({
          data: {
            workOrderId: id,
            fromStage: current.stage,
            toStage: nextStage,
            note: input.note || defaultNote,
            changedBy,
          },
        });
      }

      const linkedOrderStatus = nextStage === "IN_PROGRESS" || nextStage === "QUALITY_CHECK"
        ? "IN_PRODUCTION"
        : nextStage === "READY"
          ? "READY_FOR_PICKUP"
          : nextStage === "COMPLETED"
            ? "COMPLETED"
            : nextStage === "CANCELLED"
              ? "CANCELLED"
              : null;
      if (linkedOrderStatus) {
        await tx.order.update({ where: { id: current.orderId }, data: { status: linkedOrderStatus } });
      }

      return { workOrder };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, workOrder: result.workOrder });
  } catch (error) {
    console.error("Work order update failed:", error);
    return NextResponse.json({ error: "Could not update the job. Please refresh and try again." }, { status: 500 });
  }
}