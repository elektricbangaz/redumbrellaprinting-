import { prisma } from "@/lib/prisma";
import { planWorkOrderMaterials } from "@/lib/production-materials";
import { sendCustomerEvent } from "@/lib/notifications";

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
    const jobs = await tx.workOrder.findMany({ where: { orderId: order.id } });
    for (const job of jobs) {
      if (job.stage === "APPROVED") {
        await tx.workOrder.update({ where: { id: job.id }, data: { stage: "QUEUED" } });
        await planWorkOrderMaterials(tx, job.id);
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: "APPROVED", toStage: "QUEUED", note: `Payment received. Provider reference: ${paymentReference}`, changedBy: "Payment provider" } });
      } else {
        await tx.workOrderEvent.create({ data: { workOrderId: job.id, fromStage: job.stage, toStage: job.stage, note: `Payment received. Provider reference: ${paymentReference}`, changedBy: "Payment provider" } });
      }
    }
    return updatedOrder;
  }).then(async (updatedOrder) => {
    try {
      await sendCustomerEvent({
        event: "PAYMENT_RECEIVED", entityType: "Order", entityId: updatedOrder.id,
        email: updatedOrder.customerEmail, phone: updatedOrder.customerPhone,
        emailSubject: `Payment received — ${updatedOrder.orderNumber}`,
        message: `Thank you. Payment has been recorded for Red Umbrella Printing order ${updatedOrder.orderNumber}.`,
        whatsappTemplate: process.env.WHATSAPP_TEMPLATE_PAYMENT_RECEIVED,
        whatsappParams: [updatedOrder.customerName, updatedOrder.orderNumber],
      });
    } catch (error) { console.error("[notification] gateway payment receipt failed", error); }
    return updatedOrder;
  });
}
