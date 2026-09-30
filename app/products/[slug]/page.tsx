import { notFound } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { CORE_CATALOG } from "@/lib/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetail({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const source=CORE_CATALOG.find((item)=>item.slug===slug);
  const row=await prisma.product.findUnique({where:{slug}}).catch(()=>null);
  if(!source && (!row || !row.active)) notFound();

  const p=source ? {
    id: row?.id ?? source.id,
    name: row?.name ?? source.name,
    slug: source.slug,
    category: row?.category ?? source.category,
    description: row?.description ?? source.description,
    basePrice: source.basePrice,
    colors: source.colors,
    sizes: source.sizes,
    images: source.images,
    quoteOnly: source.quoteOnly ?? source.basePrice<=0,
  } : {
    id: row!.id,
    name: row!.name,
    slug: row!.slug,
    category: row!.category,
    description: row!.description,
    basePrice: row!.basePrice,
    colors: row!.colors as string[],
    sizes: row!.sizes as string[],
    images: row!.images as string[],
    quoteOnly: row!.basePrice<=0,
  };

  const image=p.images[0] || "/mockups/plain-white-shirt.webp";

  return <main className="sf">
    <SiteHeader/>
    <section className="product-detail">
      <div className="product-detail-media"><ProductImage src={image} alt={p.name}/></div>
      <div className="product-detail-copy">
        <span>{p.category}</span>
        <h1>{p.name}</h1>
        <strong>{p.quoteOnly ? "Custom quote" : formatJMD(p.basePrice)}</strong>
        <p>{p.description}</p>
        <div className="product-meta">
          <div><b>Available colours</b><p>{p.colors.join(" · ")}</p></div>
          <div><b>Sizes / formats</b><p>{p.sizes.join(" · ")}</p></div>
        </div>
        {p.quoteOnly ? <>
          <a className="sf-primary" href={`/quote?product=${p.slug}`}>Request a production quote <ArrowRight/></a>
          <a className="sf-secondary" href={`/create?product=${p.slug}`}>Configure / preview this product</a>
        </> : <>
          <a className="sf-primary" href={`/create?product=${p.slug}`}>Customize this product <ArrowRight/></a>
          <a className="sf-secondary" href="/quote">Need bulk or something custom?</a>
        </>}
        <ul>
          <li><Check/>Artwork upload supported</li>
          <li><Check/>Production specifications stay with the job</li>
          <li><Check/>{p.quoteOnly ? "Pricing confirmed by production before payment" : "Server recalculates order pricing at checkout"}</li>
        </ul>
      </div>
    </section>
    <SiteFooter/>
  </main>;
}
