import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CORE_CATALOG } from "@/lib/catalog";
import { generateOrderNumber, generateWorkOrderNumber } from "@/lib/order-numbers";
import { buildRedirectUrl } from "@/lib/payments";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  }),
  paymentProvider: z.enum(["WIPAY", "FYGARO"]),
  items: z.array(z.object({
    productId: z.string(),
    productSlug: z.string().optional(),
    size: z.string(),
    color: z.string(),
    quantity: z.number().int().min(1).max(500),
    design: z.object({
      canvasData: z.unknown(),
      previewImage: z.string().nullable().optional(),
    }).optional(),
  })).min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { customer, paymentProvider, items } = parsed.data;

  const resolvedProducts = await Promise.all(items.map(async (item) => {
    let product = await prisma.product.findUnique({ where: { id: item.productId } }).catch(() => null);
    if (product) return product;

    if (!item.productSlug) return null;
    const source = CORE_CATALOG.find((p) => p.slug === item.productSlug);
    if (!source || source.quoteOnly || source.basePrice <= 0) return null;

    return prisma.product.upsert({
      where: { slug: source.slug },
      update: {
        name: source.name,
        category: source.category,
        description: source.description,
        basePrice: source.basePrice,
        colors: source.colors,
        sizes: source.sizes,
        images: source.images,
        active: true,
      },
      create: {
        name: source.name,
        slug: source.slug,
        category: source.category,
        description: source.description,
        basePrice: source.basePrice,
        colors: source.colors,
        sizes: source.sizes,
        images: source.images,
        active: true,
      },
    });
  }));

  if (resolvedProducts.some((p) => !p)) {
    return NextResponse.json({ error: "One or more products require a quote or are no longer available." }, { status: 400 });
  }

  const customerRecord = await prisma.customer.upsert({
    where: { email: customer.email },
    update: { name: customer.name, phone: customer.phone, address: customer.address },
    create: { email: customer.email, name: customer.name, phone: customer.phone, address: customer.address },
  });

  let subtotal = 0;
  const itemsForCreate = items.map((item, index) => {
    const product = resolvedProducts[index]!;
    const lineTotal = product.basePrice * item.quantity;
    subtotal += lineTotal;
    return { item, product, lineTotal };
  });

  const orderNumber = generateOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customerRecord.id,
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone,
      shippingAddress: customer.address,
      notes: customer.notes,
      status: "PENDING_PAYMENT",
      paymentProvider,
      paymentStatus: "PENDING",
      subtotal,
      total: subtotal,
      items: {
        create: await Promise.all(itemsForCreate.map(async ({ item, product, lineTotal }) => {
          let designId: string | undefined;
          if (item.design) {
            const design = await prisma.design.create({
              data: {
                productId: product.id,
                customerId: customerRecord.id,
                color: item.color,
                canvasData: item.design.canvasData as object,
                previewImage: item.design.previewImage ?? undefined,
              },
            });
            designId = design.id;
          }
          return {
            productId: product.id,
            designId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: product.basePrice,
            lineTotal,
          };
        })),
      },
      workOrders: { create: { workOrderNumber: generateWorkOrderNumber(), stage: "QUEUED" } },
    },
  });

  const redirectUrl = buildRedirectUrl({
    provider: paymentProvider,
    orderNumber: order.orderNumber,
    totalCents: order.total,
    currency: order.currency,
    customerEmail: customer.email,
    customerName: customer.name,
  });

  return NextResponse.json({ orderNumber: order.orderNumber, redirectUrl });
}
