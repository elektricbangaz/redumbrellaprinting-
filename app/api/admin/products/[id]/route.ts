import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/i, "Slug must contain only letters, numbers, and hyphens.").optional(),
  category: z.string().min(1).max(80).optional(),
  description: z.string().optional().or(z.literal("")).optional(),
  basePrice: z.number().int().min(0).optional(),
  colors: z.array(z.string()).min(1).optional(),
  sizes: z.array(z.string()).min(1).optional(),
  images: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product update.", details: parsed.error.flatten() }, { status: 400 });
  }

  const updates = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...updates,
      description: updates.description === undefined ? undefined : (updates.description || null),
    },
  });

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true, product });
}
