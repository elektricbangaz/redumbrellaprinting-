import { notFound } from "next/navigation";
import { getStoreProducts } from "@/lib/store-products";
import { formatJMD } from "@/lib/money";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getStoreProducts();
  const p = products.find((item) => item.slug === slug);
  if (!p) notFound();

  return (
    <main className="sf">
      <SiteHeader />
      <section className="product-detail">
        <div className="product-detail-media"><img src={p.images[0]} alt={p.name} /></div>
        <div className="product-detail-copy">
          <span>{p.category}</span>
          <h1>{p.name}</h1>
          <strong>{p.basePrice > 0 ? formatJMD(p.basePrice) : "Custom quote"}</strong>
          <p>{p.description}</p>
          <div className="product-meta">
            <div><b>Available colours</b><p>{p.colors.join(" · ")}</p></div>
            <div><b>Sizes</b><p>{p.sizes.join(" · ")}</p></div>
          </div>
          {p.basePrice > 0 ? (
            <a className="sf-primary" href={`/create?product=${p.slug}`}>Customize this product <ArrowRight /></a>
          ) : (
            <a className="sf-primary" href="/quote">Request a production quote <ArrowRight /></a>
          )}
          <a className="sf-secondary" href="/quote">Need bulk or something custom?</a>
          <ul>
            <li><Check /> Artwork upload supported</li>
            <li><Check /> Saved to your cart before checkout</li>
            <li><Check /> Server recalculates order pricing at checkout</li>
          </ul>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
