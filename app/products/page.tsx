import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductsBrowser } from "./ProductsBrowser";

export const dynamic="force-dynamic";

const fallbackProducts = [
  {id:"fallback-shirt",name:"Standard T-Shirt",slug:"standard-t-shirt",category:"Apparel",description:"Classic printable T-shirt for custom artwork, staff wear, events and merchandise.",basePrice:1800,images:["/mockups/plain-white-shirt.webp"]},
  {id:"fallback-hoodie",name:"Pullover Hoodie",slug:"pullover-hoodie",category:"Apparel",description:"Custom pullover hoodie for brands, teams and merchandise.",basePrice:4800,images:["/mockups/category-apparel.webp"]},
  {id:"fallback-promo",name:"Branded Bottle",slug:"branded-bottle",category:"Promotional",description:"Custom branded drinkware for corporate, event and promotional use.",basePrice:2500,images:["/mockups/category-promotional.webp"]},
  {id:"fallback-signage",name:"Custom Signage",slug:"custom-signage",category:"Signs",description:"Acrylic, LED, routed and display signage quoted to specification.",basePrice:0,images:["/mockups/category-signage.webp"]},
  {id:"fallback-vehicle",name:"Vehicle Graphics",slug:"vehicle-graphics",category:"Vehicle",description:"Fleet graphics, wraps and decals priced from your vehicle and coverage requirements.",basePrice:0,images:["/mockups/category-vehicle.webp"]},
  {id:"fallback-banners",name:"Banners & Large Format",slug:"banners-large-format",category:"Banners",description:"Vinyl banners, mesh, posters and large-format print.",basePrice:0,images:["/mockups/category-banners.webp"]},
];

export default async function ProductsPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
  const sp=await searchParams;
  let products:any[]=fallbackProducts;
  try{
    const rows=await prisma.product.findMany({where:{active:true},orderBy:{createdAt:"asc"}});
    if(rows.length){
      const overrides:Record<string,string>={
        "standard-t-shirt":"/mockups/plain-white-shirt.webp",
        "pullover-hoodie":"/mockups/category-apparel.webp",
        "trucker-cap":"/mockups/category-apparel.webp"
      };
      products=rows.map(p=>({...p,images:[overrides[p.slug]||(p.images as string[])[0]]}));
    }
  }catch(error){
    console.error("Product catalog database unavailable; using storefront fallback catalog.", error);
  }
  return <main className="sf"><SiteHeader/><section className="content-hero content-hero-compact"><span>SHOP</span><h1>Products built to customize.</h1><p>Choose a standard product for instant configuration, or use Custom Quote for jobs that need production review.</p></section><ProductsBrowser products={products} initialQuery={sp.q||""} initialCategory={sp.category||""}/><SiteFooter/></main>
}
