import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/i, "Slug must contain only letters, numbers, and hyphens."),
  category: z.string().min(1).max(80),
  description: z.string().optional().or(z.literal("")),
  basePrice: z.number().int().min(0),
  colors: z.array(z.string()).min(1),
  sizes: z.array(z.string()).min(1),
  images: z.array(z.string()).default([]),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product payload.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const product = await prisma.product.upsert({
    where: { slug: data.slug },
    update: {
      name: data.name,
      category: data.category,
      description: data.description ?? null,
      basePrice: data.basePrice,
      colors: data.colors,
      sizes: data.sizes,
      images: data.images,
      active: data.active,
    },
    create: {
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description ?? null,
      basePrice: data.basePrice,
      colors: data.colors,
      sizes: data.sizes,
      images: data.images,
      active: data.active,
    },
  });

  return NextResponse.json({ ok: true, product });
}
