import { prisma } from "@/lib/prisma";
import { PosTerminal } from "./PosTerminal";

export const dynamic = "force-dynamic";

export default async function PosPage(){
 const products=await prisma.product.findMany({where:{active:true},orderBy:[{category:"asc"},{name:"asc"}]});
 return <div className="ru-page">
  <div className="ru-page-heading"><div><h1>POS Terminal</h1><p>Walk-in sales create the same customer, order, invoice, payment and production records as online jobs.</p></div></div>
  <PosTerminal products={products.map(product=>({id:product.id,name:product.name,slug:product.slug,category:product.category,basePrice:product.basePrice,colors:Array.isArray(product.colors)?product.colors.filter((x):x is string=>typeof x==="string"):[],sizes:Array.isArray(product.sizes)?product.sizes.filter((x):x is string=>typeof x==="string"):[]}))}/>
 </div>;
}
