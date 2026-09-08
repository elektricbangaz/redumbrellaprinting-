import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DesignerApp } from "./DesignerApp";

export const dynamic = "force-dynamic";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  const initialProduct =
    products.find((p) => p.slug === product) ?? products[0] ?? null;

  return (
    <main>
      <SiteHeader />
      <div className="page-shell">
        <div className="section-heading" style={{ textAlign: "left" }}>
          <h2>
            CREATE YOUR <span style={{ color: "var(--red)" }}>CUSTOM APPAREL</span>
          </h2>
          <p>Bring your ideas to life — custom prints made with premium quality and factory precision.</p>
        </div>
        {initialProduct ? (
          <DesignerApp
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              basePrice: p.basePrice,
              colors: p.colors as string[],
              sizes: p.sizes as string[],
              images: p.images as string[],
            }))}
            initialProductId={initialProduct.id}
          />
        ) : (
          <p>No products available yet.</p>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
