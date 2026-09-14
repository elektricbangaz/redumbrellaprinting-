import { prisma } from "@/lib/prisma";
import { CORE_CATALOG } from "@/lib/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductsBrowser } from "./ProductsBrowser";

export const dynamic = "force-dynamic";

const fallbackProducts = CORE_CATALOG.map(({ colors, sizes, quoteOnly, ...p }) => p);

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  let products: any[] = fallbackProducts;

  try {
    const rows = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });

    if (rows.length) {
      const merged = [...CORE_CATALOG];
      const known = new Set(merged.map((p) => p.slug));

      products = rows.map((row) => {
        const source = CORE_CATALOG.find((c) => c.slug === row.slug);
        return {
          ...row,
          images: source?.images || (row.images as string[]),
        };
      });

      for (const item of CORE_CATALOG) {
        if (!rows.some((row) => row.slug === item.slug)) {
          const { colors, sizes, quoteOnly, ...display } = item;
          products.push(display);
        }
      }
    }
  } catch (error) {
    console.error("Product catalog database unavailable; using storefront fallback catalog.", error);
  }

  return (
    <main className="sf">
      <SiteHeader />
      <section className="content-hero content-hero-compact">
        <span>SHOP</span>
        <h1>Products built to customize.</h1>
        <p>
          Choose a standard product for instant configuration, or use Custom Quote for jobs that
          need production review.
        </p>
      </section>
      <ProductsBrowser
        products={products}
        initialQuery={sp.q || ""}
        initialCategory={sp.category || ""}
      />
      <SiteFooter />
    </main>
  );
}
