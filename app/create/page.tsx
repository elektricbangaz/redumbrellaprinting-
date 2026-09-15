import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CORE_CATALOG } from "@/lib/catalog";
import { DesignerApp } from "./DesignerApp";

export const dynamic = "force-dynamic";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const sp = await searchParams;
  let products = CORE_CATALOG.map((p) => ({ ...p }));

  try {
    const synced = await Promise.all(
      CORE_CATALOG.map((item) =>
        prisma.product.upsert({
          where: { slug: item.slug },
          update: {
            name: item.name,
            category: item.category,
            description: item.description,
            basePrice: item.basePrice,
            colors: item.colors,
            sizes: item.sizes,
            images: item.images,
            active: true,
          },
          create: {
            name: item.name,
            slug: item.slug,
            category: item.category,
            description: item.description,
            basePrice: item.basePrice,
            colors: item.colors,
            sizes: item.sizes,
            images: item.images,
            active: true,
          },
        })
      )
    );

    products = synced.map((row) => {
      const source = CORE_CATALOG.find((p) => p.slug === row.slug)!;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        description: row.description || source.description,
        basePrice: row.basePrice,
        colors: row.colors as string[],
        sizes: row.sizes as string[],
        images: source.images,
        quoteOnly: source.quoteOnly ?? false,
        previewMode: source.previewMode,
      };
    });
  } catch (error) {
    console.error("Create Studio database unavailable; using resilient catalog.", error);
  }

  const selected = products.find((p) => p.slug === sp.product) || products[0];

  return (
    <main className="sf">
      <SiteHeader />
      <section className="content-hero content-hero-compact create-intro-v3">
        <span>CREATE STUDIO</span>
        <h1>Make it yours.</h1>
        <p>
          Select any product, add artwork or text, preview it on the item, then order directly
          or continue into a production quote for custom jobs.
        </p>
      </section>
      <section className="designer-shell">
        <DesignerApp products={products} initialProductId={selected.id} />
      </section>
      <SiteFooter />
    </main>
  );
}
