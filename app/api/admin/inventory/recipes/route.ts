import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  productionMethod: z.string().trim().max(120).nullable().optional(),
  placement: z.string().trim().max(120).nullable().optional(),
  quantityPerUnit: z.number().positive().max(1000000),
  wastePercent: z.number().min(0).max(100).default(0),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Complete the material recipe." }, { status: 400 });
  const [product, item] = await Promise.all([
    prisma.product.findUnique({ where: { id: parsed.data.productId } }),
    prisma.inventoryItem.findUnique({ where: { id: parsed.data.inventoryItemId } }),
  ]);
  if (!product || !item) return NextResponse.json({ error: "Product or inventory item not found." }, { status: 404 });
  const recipe = await prisma.inventoryRecipe.create({
    data: {
      productId: product.id,
      inventoryItemId: item.id,
      productionMethod: parsed.data.productionMethod || null,
      placement: parsed.data.placement || null,
      quantityPerUnit: parsed.data.quantityPerUnit,
      wastePercent: parsed.data.wastePercent,
    },
  });
  return NextResponse.json({ ok: true, recipe });
}
