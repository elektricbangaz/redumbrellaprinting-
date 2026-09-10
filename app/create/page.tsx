import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DesignerApp } from "./DesignerApp";

export const dynamic="force-dynamic";

const imageOverrides:Record<string,string>={
 "standard-t-shirt":"/mockups/plain-white-shirt.webp",
 "pullover-hoodie":"/mockups/category-apparel.webp",
 "trucker-cap":"/mockups/category-apparel.webp"
};

export default async function CreatePage({searchParams}:{searchParams:Promise<{product?:string}>}){
 const sp=await searchParams;
 const rows=await prisma.product.findMany({where:{active:true},orderBy:{createdAt:"asc"}});
 if(!rows.length) return <main className="sf"><SiteHeader/><section className="content-hero"><span>CREATE STUDIO</span><h1>No products are available yet.</h1><p>Add an active product in admin before opening the designer.</p></section><SiteFooter/></main>;
 const products=rows.map(p=>({id:p.id,name:p.name,slug:p.slug,basePrice:p.basePrice,colors:p.colors as string[],sizes:p.sizes as string[],images:[imageOverrides[p.slug]||(p.images as string[])[0]]}));
 const selected=products.find(p=>p.slug===sp.product)||products[0];
 return <main className="sf"><SiteHeader/><section className="content-hero content-hero-compact"><span>CREATE STUDIO</span><h1>Make it yours.</h1><p>Choose a product, upload artwork or add text, preview the print area, then add the finished configuration to your cart.</p></section><section className="designer-shell"><DesignerApp products={products} initialProductId={selected.id}/></section><SiteFooter/></main>;
}
