import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { CORE_CATALOG } from "@/lib/catalog";

export const dynamic="force-dynamic";

type AdminCatalogRow = {
  id:string;
  name:string;
  slug:string;
  category:string;
  basePrice:number;
  sizes:string[];
  active:boolean;
  quoteOnly:boolean;
  source:"Canonical"|"Database";
};

export default async function AdminProductsPage(){
  const rows=await prisma.product.findMany({orderBy:{createdAt:"desc"}});
  const rowMap=new Map(rows.map(row=>[row.slug,row]));
  const products:AdminCatalogRow[]=CORE_CATALOG.map(source=>{
    const row=rowMap.get(source.slug);
    return {
      id:row?.id??source.id,
      name:source.name,
      slug:source.slug,
      category:source.category,
      basePrice:source.basePrice,
      sizes:source.sizes,
      active:row?.active??true,
      quoteOnly:source.quoteOnly??source.basePrice<=0,
      source:"Canonical" as const,
    };
  });
  for(const row of rows){
    if(products.some(p=>p.slug===row.slug))continue;
    products.push({
      id:row.id,name:row.name,slug:row.slug,category:row.category,basePrice:row.basePrice,
      sizes:Array.isArray(row.sizes)?row.sizes as string[]:[],active:row.active,quoteOnly:row.basePrice<=0,source:"Database" as const,
    });
  }
  return <div className="ru-page">
    <div className="admin-header"><div><h1>Products</h1><p>{products.length} catalog items available across storefront, designer and production.</p></div></div>
    <div className="admin-card"><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Name</th><th>Slug</th><th>Category</th><th>Pricing</th><th>Sizes / Formats</th><th>Source</th><th>Status</th></tr></thead>
      <tbody>{products.map(product=><tr key={product.slug}>
        <td>{product.name}</td><td>{product.slug}</td><td>{product.category}</td>
        <td>{product.quoteOnly?"Custom quote":formatJMD(product.basePrice)}</td>
        <td>{product.sizes.length}</td><td>{product.source}</td>
        <td><span className={"badge "+(product.active?"badge-green":"badge-grey")}>{product.active?"Active":"Inactive"}</span></td>
      </tr>)}</tbody>
    </table></div></div>
  </div>;
}
