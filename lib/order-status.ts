import { prisma } from "@/lib/prisma";

export async function markOrderPaid(orderNumber: string, paymentReference: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return null;
  if (order.paymentStatus === "PAID") return order;

  return prisma.order.update({
    where: { orderNumber },
    data: {
      paymentStatus: "PAID",
      status: "PAID",
      paymentReference,
    },
  });
}
