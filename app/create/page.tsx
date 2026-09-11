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

const fallbackProducts=[
 {id:"fallback-shirt",name:"Standard T-Shirt",slug:"standard-t-shirt",basePrice:1800,colors:["White","Black","Red","Navy"],sizes:["S","M","L","XL","2XL"],images:["/mockups/plain-white-shirt.webp"]},
 {id:"fallback-hoodie",name:"Pullover Hoodie",slug:"pullover-hoodie",basePrice:4800,colors:["Black","White","Grey"],sizes:["S","M","L","XL","2XL"],images:["/mockups/category-apparel.webp"]}
];

export default async function CreatePage({searchParams}:{searchParams:Promise<{product?:string}>}){
 const sp=await searchParams;
 let products:any[]=fallbackProducts;
 try{
   const rows=await prisma.product.findMany({where:{active:true},orderBy:{createdAt:"asc"}});
   if(rows.length){
     products=rows.map(p=>({id:p.id,name:p.name,slug:p.slug,basePrice:p.basePrice,colors:p.colors as string[],sizes:p.sizes as string[],images:[imageOverrides[p.slug]||(p.images as string[])[0]]}));
   }
 }catch(error){
   console.error("Create Studio database unavailable; using fallback products.", error);
 }
 const selected=products.find(p=>p.slug===sp.product)||products[0];
 return <main className="sf"><SiteHeader/><section className="content-hero content-hero-compact"><span>CREATE STUDIO</span><h1>Make it yours.</h1><p>Choose a product, upload artwork or add text, preview the print area, then add the finished configuration to your cart.</p></section><section className="designer-shell"><DesignerApp products={products} initialProductId={selected.id}/></section><SiteFooter/></main>;
}
