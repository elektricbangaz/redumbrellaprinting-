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
  designDocument: z.unknown().optional(),
  surfaces: z.unknown().optional(),
  activeSurfaceId: z.string().optional(),
  decorationMethod: z.string().optional(),
  surfaceExports: z.record(z.string()).optional(),
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

function safePart(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "surface";
}

async function persistArtworkInDesign({
  designValue,
  folder,
  stamp,
  namespace,
}: {
  designValue: unknown;
  folder: string;
  stamp: string;
  namespace: string;
}) {
  if (!designValue || typeof designValue !== "object") return designValue as Prisma.InputJsonValue;
  const sourceDesign = structuredClone(designValue as Record<string, unknown>) as any;

  const persistLayerArray = async (layers: any[], surfaceName: string) => {
    for (let index = 0; index < layers.length; index += 1) {
      const layer = layers[index];
      if (layer?.type !== "image" || typeof layer?.src !== "string" || !layer.src.startsWith("data:")) continue;
      const uploaded = await uploadDataUrl({
        dataUrl: layer.src,
        folder: `${folder}/artwork`,
        publicId: `${stamp}-${namespace}-${safePart(surfaceName)}-layer-${index + 1}`,
      });
      layer.src = uploaded.secure_url;
      layer.cloudinaryPublicId = uploaded.public_id;
    }
  };

  if (sourceDesign.surfaces && typeof sourceDesign.surfaces === "object") {
    for (const [surfaceName, layers] of Object.entries(sourceDesign.surfaces)) {
      if (Array.isArray(layers)) await persistLayerArray(layers, surfaceName);
    }
  }

  for (const sideName of ["front", "back"]) {
    const sideLayers = Array.isArray(sourceDesign?.[sideName]) ? sourceDesign[sideName] : [];
    if (sideLayers.length) await persistLayerArray(sideLayers, sideName);
  }

  return sourceDesign as Prisma.InputJsonValue;
}

async function uploadSurfaceExports(
  surfaceExports: Record<string, string> | undefined,
  folder: string,
  stamp: string
) {
  const entries = Object.entries(surfaceExports || {}).filter(([, value]) => typeof value === "string" && value.startsWith("data:"));
  const uploaded = await Promise.all(
    entries.map(async ([surfaceId, dataUrl]) => {
      const asset = await uploadDataUrl({
        dataUrl,
        folder: `${folder}/surfaces`,
        publicId: `${stamp}-${safePart(surfaceId)}`,
      });
      return [surfaceId, asset.secure_url] as const;
    })
  );
  return Object.fromEntries(uploaded) as Record<string, string>;
}

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

      const persistedDesign = await persistArtworkInDesign({
        designValue: input.design,
        folder,
        stamp,
        namespace: "legacy",
      });
      const persistedDocument = await persistArtworkInDesign({
        designValue: input.designDocument ?? { surfaces: input.surfaces ?? {} },
        folder,
        stamp,
        namespace: "surface",
      });

      const [front, back, preview, persistedSurfaceExports] = await Promise.all([
        input.frontExport ? uploadDataUrl({ dataUrl: input.frontExport, folder, publicId: `${stamp}-front` }) : Promise.resolve(null),
        input.backExport ? uploadDataUrl({ dataUrl: input.backExport, folder, publicId: `${stamp}-back` }) : Promise.resolve(null),
        input.previewImage ? uploadDataUrl({ dataUrl: input.previewImage, folder, publicId: `${stamp}-mockup` }) : Promise.resolve(null),
        uploadSurfaceExports(input.surfaceExports, folder, stamp),
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
          activeSurfaceId: input.activeSurfaceId ?? null,
          printZoneId: input.printZoneId ?? null,
          supplyMode: input.supplyMode ?? null,
          decorationMethod: input.decorationMethod ?? null,
          pricing: input.pricing ?? null,
        },
        designDocument: persistedDocument,
        legacyDesign: persistedDesign,
        exports: {
          surfaces: persistedSurfaceExports,
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
          surfaces: persistedSurfaceExports,
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

    const persistedDesign = await persistArtworkInDesign({
      designValue: input.design,
      folder,
      stamp,
      namespace: "legacy",
    });
    const persistedDocument = await persistArtworkInDesign({
      designValue: input.designDocument ?? { surfaces: input.surfaces ?? {} },
      folder,
      stamp,
      namespace: "surface",
    });

    const [front, back, preview, persistedSurfaceExports] = await Promise.all([
      input.frontExport
        ? uploadDataUrl({ dataUrl: input.frontExport, folder, publicId: `${stamp}-front` })
        : Promise.resolve(null),
      input.backExport
        ? uploadDataUrl({ dataUrl: input.backExport, folder, publicId: `${stamp}-back` })
        : Promise.resolve(null),
      input.previewImage
        ? uploadDataUrl({ dataUrl: input.previewImage, folder, publicId: `${stamp}-mockup` })
        : Promise.resolve(null),
      uploadSurfaceExports(input.surfaceExports, folder, stamp),
    ]);

    const record = await prisma.design.create({
      data: {
        productId: product.id,
        customerId: customer.id,
        color: input.color,
        previewImage: preview?.secure_url,
        canvasData: {
          schemaVersion: 2,
          designDocument: persistedDocument,
          legacyDesign: persistedDesign,
          productSlug: input.productSlug,
          productName: input.productName,
          color: input.color,
          size: input.size,
          quantity: input.quantity,
          activeSurfaceId: input.activeSurfaceId ?? null,
          printZoneId: input.printZoneId ?? null,
          supplyMode: input.supplyMode ?? null,
          decorationMethod: input.decorationMethod ?? null,
          pricing: input.pricing ?? null,
          exports: {
            surfaces: persistedSurfaceExports,
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
        surfaces: persistedSurfaceExports,
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
