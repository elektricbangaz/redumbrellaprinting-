import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CORE_CATALOG } from "@/lib/catalog";
import { uploadDataUrl } from "@/lib/cloudinary-server";

const schema = z.object({
  productId: z.string(),
  productSlug: z.string(),
  productName: z.string(),
  color: z.string(),
  size: z.string(),
  quantity: z.number().int().min(1).max(1000),
  design: z.unknown(),
  printZoneId: z.string().optional(),
  supplyMode: z.enum(["red-umbrella", "customer"]).optional(),
  pricing: z.unknown().optional(),
  frontExport: z.string().optional(),
  backExport: z.string().optional(),
  previewImage: z.string().optional(),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid design submission." }, { status: 400 });
  }

  const input = parsed.data;
  const source = CORE_CATALOG.find((p) => p.slug === input.productSlug);

  try {
    if (!process.env.DATABASE_URL) {
      const stamp = Date.now().toString();
      const safeEmail = input.customer.email.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "customer";
      const folder = `red-umbrella/designs/${safeEmail}/${input.productSlug}`;

      const persistedDesign = structuredClone(input.design as Record<string, unknown>) as any;
      for (const sideName of ["front", "back"]) {
        const sideLayers = Array.isArray(persistedDesign?.[sideName]) ? persistedDesign[sideName] : [];
        for (let index = 0; index < sideLayers.length; index += 1) {
          const layer = sideLayers[index];
          if (layer?.type !== "image" || typeof layer?.src !== "string" || !layer.src.startsWith("data:")) continue;
          const uploaded = await uploadDataUrl({
            dataUrl: layer.src,
            folder: `${folder}/artwork`,
            publicId: `${stamp}-${sideName}-layer-${index + 1}`,
          });
          layer.src = uploaded.secure_url;
          layer.cloudinaryPublicId = uploaded.public_id;
        }
      }

      const [front, back, preview] = await Promise.all([
        input.frontExport ? uploadDataUrl({ dataUrl: input.frontExport, folder, publicId: `${stamp}-front` }) : Promise.resolve(null),
        input.backExport ? uploadDataUrl({ dataUrl: input.backExport, folder, publicId: `${stamp}-back` }) : Promise.resolve(null),
        input.previewImage ? uploadDataUrl({ dataUrl: input.previewImage, folder, publicId: `${stamp}-mockup` }) : Promise.resolve(null),
      ]);

      const metadataPayload = {
        reference: `RUP-D-${stamp.slice(-8)}`,
        submittedAt: new Date().toISOString(),
        customer: input.customer,
        product: {
          id: input.productId,
          slug: input.productSlug,
          name: input.productName,
          color: input.color,
          size: input.size,
          quantity: input.quantity,
          printZoneId: input.printZoneId ?? null,
          supplyMode: input.supplyMode ?? null,
          pricing: input.pricing ?? null,
        },
        design: persistedDesign,
        exports: {
          front: front?.secure_url ?? null,
          back: back?.secure_url ?? null,
          preview: preview?.secure_url ?? null,
        },
      };
      const metadataDataUrl = `data:application/json;base64,${Buffer.from(JSON.stringify(metadataPayload)).toString("base64")}`;
      const metadata = await uploadDataUrl({
        dataUrl: metadataDataUrl,
        folder,
        publicId: `${stamp}-metadata`,
        resourceType: "raw",
      });

      return NextResponse.json({
        ok: true,
        designId: null,
        reference: metadataPayload.reference,
        assets: {
          front: front?.secure_url ?? null,
          back: back?.secure_url ?? null,
          preview: preview?.secure_url ?? null,
          metadata: metadata.secure_url,
        },
      });
    }

    const product = await prisma.product.upsert({
      where: { slug: input.productSlug },
      update: source ? {
        name: source.name,
        category: source.category,
        description: source.description,
        basePrice: source.basePrice,
        colors: source.colors,
        sizes: source.sizes,
        images: source.images,
        active: true,
      } : {},
      create: source ? {
        name: source.name,
        slug: source.slug,
        category: source.category,
        description: source.description,
        basePrice: source.basePrice,
        colors: source.colors,
        sizes: source.sizes,
        images: source.images,
        active: true,
      } : {
        name: input.productName,
        slug: input.productSlug,
        category: "Custom",
        basePrice: 0,
        colors: [input.color],
        sizes: [input.size],
        images: [],
        active: true,
      },
    });

    const customer = await prisma.customer.upsert({
      where: { email: input.customer.email },
      update: { name: input.customer.name, phone: input.customer.phone },
      create: { email: input.customer.email, name: input.customer.name, phone: input.customer.phone },
    });

    const folder = `red-umbrella/designs/${customer.id}/${input.productSlug}`;
    const stamp = Date.now().toString();

    const persistArtwork = async (designValue: unknown) => {
      if (!designValue || typeof designValue !== "object") return designValue as Prisma.InputJsonValue;
      const sourceDesign = structuredClone(designValue as Record<string, unknown>) as any;
      for (const sideName of ["front", "back"]) {
        const sideLayers = Array.isArray(sourceDesign?.[sideName]) ? sourceDesign[sideName] : [];
        for (let index = 0; index < sideLayers.length; index += 1) {
          const layer = sideLayers[index];
          if (layer?.type !== "image" || typeof layer?.src !== "string" || !layer.src.startsWith("data:")) continue;
          const uploaded = await uploadDataUrl({
            dataUrl: layer.src,
            folder: `${folder}/artwork`,
            publicId: `${stamp}-${sideName}-layer-${index + 1}`,
          });
          layer.src = uploaded.secure_url;
          layer.cloudinaryPublicId = uploaded.public_id;
        }
      }
      return sourceDesign as Prisma.InputJsonValue;
    };

    const persistedDesign = await persistArtwork(input.design);

    const [front, back, preview] = await Promise.all([
      input.frontExport
        ? uploadDataUrl({ dataUrl: input.frontExport, folder, publicId: `${stamp}-front` })
        : Promise.resolve(null),
      input.backExport
        ? uploadDataUrl({ dataUrl: input.backExport, folder, publicId: `${stamp}-back` })
        : Promise.resolve(null),
      input.previewImage
        ? uploadDataUrl({ dataUrl: input.previewImage, folder, publicId: `${stamp}-mockup` })
        : Promise.resolve(null),
    ]);

    const record = await prisma.design.create({
      data: {
        productId: product.id,
        customerId: customer.id,
        color: input.color,
        previewImage: preview?.secure_url,
        canvasData: {
          design: persistedDesign,
          productSlug: input.productSlug,
          productName: input.productName,
          color: input.color,
          size: input.size,
          quantity: input.quantity,
          printZoneId: input.printZoneId ?? null,
          supplyMode: input.supplyMode ?? null,
          pricing: input.pricing ?? null,
          exports: {
            front: front?.secure_url ?? null,
            back: back?.secure_url ?? null,
            preview: preview?.secure_url ?? null,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      designId: record.id,
      reference: `RUP-D-${record.id.slice(-8).toUpperCase()}`,
      assets: {
        front: front?.secure_url ?? null,
        back: back?.secure_url ?? null,
        preview: preview?.secure_url ?? null,
      },
    });
  } catch (error) {
    console.error("[designs/complete] submission failed", error);
    return NextResponse.json(
      { error: "We couldn’t submit your design just now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
