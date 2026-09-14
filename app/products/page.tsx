import { prisma } from "@/lib/prisma";
import { CORE_CATALOG } from "@/lib/catalog";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductsBrowser } from "./ProductsBrowser";

export const dynamic="force-dynamic";

const fallbackProducts = CORE_CATALOG.map(({ colors, sizes, quoteOnly, ...p }) => p);\n\nexport default async function ProductsPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
  const sp=await searchParams;
  let products:any[]=fallbackProducts;
  try{
    const rows=await prisma.product.findMany({where:{active:true},orderBy:{createdAt:"asc"}});
    if(rows.length){
      products=rows.map(p=>{ const source=CORE_CATALOG.find(c=>c.slug===p.slug); return {...p,images:source?.images || (p.images as string[])}; });
    }
  }catch(error){
    console.error("Product catalog database unavailable; using storefront fallback catalog.", error);
  }
  return <main className="sf"><SiteHeader/><section className="content-hero content-hero-compact"><span>SHOP</span><h1>Products built to customize.</h1><p>Choose a standard product for instant configuration, or use Custom Quote for jobs that need production review.</p></section><ProductsBrowser products={products} initialQuery={sp.q||""} initialCategory={sp.category||""}/><SiteFooter/></main>
}
