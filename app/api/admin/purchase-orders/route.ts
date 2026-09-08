import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePONumber } from "@/lib/order-numbers";

const schema = z.object({
  vendorName: z.string().min(1),
  vendorEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().min(1),
        unitCost: z.number().int().min(0),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid purchase order.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { vendorName, vendorEmail, notes, items } = parsed.data;

  const itemsWithTotals = items.map((i) => ({
    ...i,
    lineTotal: i.quantity * i.unitCost,
  }));
  const total = itemsWithTotals.reduce((sum, i) => sum + i.lineTotal, 0);

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: generatePONumber(),
      vendorName,
      vendorEmail: vendorEmail || undefined,
      notes,
      total,
      items: { create: itemsWithTotals },
    },
  });

  return NextResponse.json({ ok: true, id: po.id });
}
