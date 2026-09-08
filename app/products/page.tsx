import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <SiteHeader />
      <div className="page-shell">
        <div className="section-heading" style={{ textAlign: "left" }}>
          <h2>ALL PRODUCTS</h2>
          <p>Pick a product to start customizing it in our designer.</p>
        </div>
        <div className="products-grid">
          {products.map((p) => (
            <a className="product-card" key={p.id} href={`/create?product=${p.slug}`}>
              <div className="product-card-img">
                <img src={(p.images as string[])[0]} alt={p.name} style={{ maxHeight: 150 }} />
              </div>
              <div className="product-card-body">
                <h3>{p.name}</h3>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{p.category}</p>
                <span className="price">{formatJMD(p.basePrice)}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
