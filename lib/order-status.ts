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
    const invoice = await tx.invoice.findFirst({
      where: { orderId: order.id, status: { not: "VOID" } },
      orderBy: { createdAt: "desc" },
    });
    if (invoice) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", amountPaid: invoice.total, balance: 0 },
      });
    }

    const existingPayment = paymentReference
      ? await tx.paymentTransaction.findFirst({
          where: { orderId: order.id, reference: paymentReference, status: "PAID" },
        })
      : null;
    if (!existingPayment) {
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          invoiceId: invoice?.id ?? null,
          provider: order.paymentProvider,
          reference: paymentReference,
          amount: order.total,
          currency: order.currency,
          status: "PAID",
          source: "GATEWAY",
        },
      });
    }
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
