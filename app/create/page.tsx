import { getStoreProducts } from "@/lib/store-products";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DesignerApp } from "./DesignerApp";

export const dynamic="force-dynamic";

export default async function CreatePage({searchParams}:{searchParams:Promise<{product?:string}>}){
 const sp=await searchParams;
 const products=await getStoreProducts();
 const selected=products.find(p=>p.slug===sp.product)||products[0];
 return <main className="sf"><SiteHeader/><section className="content-hero content-hero-compact"><span>CREATE STUDIO</span><h1>Make it yours.</h1><p>Choose a product, upload artwork or add text, preview the print area, then add the finished configuration to your cart.</p></section><section className="designer-shell"><DesignerApp products={products} initialProductId={selected.id}/></section><SiteFooter/></main>;
}
