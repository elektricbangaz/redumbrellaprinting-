import { prisma } from "@/lib/prisma";

export async function markOrderPaid(orderNumber: string, paymentReference: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return null;
  if (order.paymentStatus === "PAID") return order;

  return prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { orderNumber },
      data: { paymentStatus: "PAID", status: "PAID", paymentReference },
    });
    const jobs = await tx.workOrder.findMany({ where: { orderId: order.id }, select: { id: true, stage: true } });
    if (jobs.length) {
      await tx.workOrderEvent.createMany({
        data: jobs.map((job) => ({
          workOrderId: job.id,
          fromStage: job.stage,
          toStage: job.stage,
          note: `Payment received. Provider reference: ${paymentReference}`,
          changedBy: "Payment provider",
        })),
      });
    }
    return updatedOrder;
  });
}
