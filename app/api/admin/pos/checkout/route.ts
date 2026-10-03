import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, generateOrderNumber, generateWorkOrderNumber } from "@/lib/order-numbers";
import { planWorkOrderMaterials } from "@/lib/production-materials";
import { sendCustomerEvent } from "@/lib/notifications";
import { formatJMD } from "@/lib/money";

const schema = z.object({
  customer: z.object({ name: z.string().trim().min(1).max(160), email: z.string().trim().email().optional().or(z.literal("")), phone: z.string().trim().max(60).optional(), address: z.string().trim().max(500).optional() }),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(100000), size: z.string().trim().min(1).max(120), color: z.string().trim().min(1).max(120), unitPriceJmd: z.number().min(0).max(100000000).optional() })).min(1),
  productionMethod: z.string().trim().max(120).optional(),
  placement: z.string().trim().max(160).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW","NORMAL","HIGH","URGENT"]).default("NORMAL"),
  fulfillmentMethod: z.enum(["PICKUP","DELIVERY"]).default("PICKUP"),
  paymentType: z.enum(["UNPAID","CASH","CARD_TERMINAL","BANK_TRANSFER"]).default("CASH"),
  notes: z.string().trim().max(5000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Complete the POS sale details.", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const actor = session.user.email ?? session.user.name ?? "POS";
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true } });
  const byId = new Map(products.map((product) => [product.id, product]));
  if (products.length !== productIds.length) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 409 });

  const missingPrice = input.items.find((item) => {
    const product = byId.get(item.productId)!;
    const unitPrice = item.unitPriceJmd !== undefined && item.unitPriceJmd > 0 ? Math.round(item.unitPriceJmd * 100) : product.basePrice;
    return unitPrice <= 0;
  });
  if (missingPrice) {
    const product = byId.get(missingPrice.productId)!;
    return NextResponse.json({ error: `${product.name} has no fixed retail price. Enter the approved unit price before checkout.` }, { status: 409 });
  }
  const priced = input.items.map((item) => {
    const product = byId.get(item.productId)!;
    const unitPrice = item.unitPriceJmd !== undefined && item.unitPriceJmd > 0 ? Math.round(item.unitPriceJmd * 100) : product.basePrice;
    return { ...item, product, unitPrice, lineTotal: unitPrice * item.quantity };
  });
  const subtotal = priced.reduce((sum, item) => sum + item.lineTotal, 0);
  const paid = input.paymentType !== "UNPAID";
  const realEmail = input.customer.email || null;
  let customer = realEmail ? await prisma.customer.findUnique({ where: { email: realEmail.toLowerCase() } }) : null;
  if (!customer && !realEmail && input.customer.phone) customer = await prisma.customer.findFirst({ where: { phone: input.customer.phone } });
  if (customer) {
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { name: input.customer.name, phone: input.customer.phone || customer.phone, address: input.customer.address || customer.address } });
  } else {
    const email = realEmail?.toLowerCase() || `walkin-${Date.now()}-${Math.random().toString(36).slice(2,7)}@pos.redumbrellaprinting.local`;
    customer = await prisma.customer.create({ data: { email, name: input.customer.name, phone: input.customer.phone || null, address: input.customer.address || null } });
  }

  const dueDate = input.dueDate ? new Date(input.dueDate) : null;
  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(), customerId: customer!.id, customerEmail: customer!.email, customerName: input.customer.name, customerPhone: input.customer.phone || null,
        shippingAddress: input.fulfillmentMethod === "DELIVERY" ? input.customer.address || null : null,
        notes: input.notes || "Created at Red Umbrella POS.", status: paid ? "PAID" : "PENDING_PAYMENT", paymentStatus: paid ? "PAID" : "UNPAID", subtotal, total: subtotal, currency: "JMD",
        items: { create: priced.map((item) => ({ productId: item.product.id, size: item.size, color: item.color, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })) },
      },
    });
    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber: generateWorkOrderNumber(), orderId: order.id, stage: paid ? "QUEUED" : "APPROVED", priority: input.priority, dueDate,
        productionMethod: input.productionMethod || null, placement: input.placement || null, fulfillmentMethod: input.fulfillmentMethod, notes: input.notes || null,
        events: { create: { toStage: paid ? "QUEUED" : "APPROVED", note: paid ? "POS sale paid and released to production queue." : "POS sale created; awaiting payment before production.", changedBy: actor } },
      },
    });
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(), customerId: customer!.id, orderId: order.id, status: paid ? "PAID" : "SENT", issueDate: new Date(), dueDate: paid ? new Date() : dueDate || new Date(),
        subtotal, tax: 0, total: subtotal, amountPaid: paid ? subtotal : 0, balance: paid ? 0 : subtotal, currency: "JMD", notes: input.notes || null,
        items: { create: priced.map((item, index) => ({ description: item.product.name, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal, sortOrder: index })) },
      },
    });
    if (paid) {
      await tx.paymentTransaction.create({ data: { orderId: order.id, invoiceId: invoice.id, provider: null, reference: null, amount: subtotal, currency: "JMD", status: "PAID", source: `POS_${input.paymentType}` } });
      await planWorkOrderMaterials(tx, workOrder.id);
    }
    return { order, invoice, workOrder };
  });

  try { await sendCustomerEvent({
    event: paid ? "POS_SALE_PAID" : "POS_ORDER_CREATED", entityType: "Order", entityId: created.order.id,
    email: realEmail, phone: input.customer.phone,
    emailSubject: `Red Umbrella Printing receipt ${created.order.orderNumber}`,
    message: `${input.customer.name}, your Red Umbrella Printing order ${created.order.orderNumber} has been created. Total: ${formatJMD(subtotal)}. ${paid ? `Payment recorded by ${input.paymentType.replaceAll("_", " ").toLowerCase()}.` : "Payment is still outstanding."}`,
    whatsappTemplate: process.env.WHATSAPP_TEMPLATE_ORDER_CREATED,
    whatsappParams: [input.customer.name, created.order.orderNumber, formatJMD(subtotal)],
  }); } catch (notificationError) { console.error("[notification] POS receipt failed", notificationError); }
  return NextResponse.json({ ok: true, orderId: created.order.id, orderNumber: created.order.orderNumber, invoiceId: created.invoice.id, workOrderId: created.workOrder.id, total: subtotal });
}
