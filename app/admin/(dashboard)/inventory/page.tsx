import { prisma } from "@/lib/prisma";
import { InventoryManager } from "./InventoryManager";

export const dynamic="force-dynamic";

export default async function AdminInventoryPage(){
 const [items,products,recipes,reservations]=await Promise.all([
  prisma.inventoryItem.findMany({where:{active:true},orderBy:[{category:"asc"},{name:"asc"}]}),
  prisma.product.findMany({where:{active:true},orderBy:[{category:"asc"},{name:"asc"}]}),
  prisma.inventoryRecipe.findMany({where:{active:true},include:{product:true,inventoryItem:true},orderBy:{createdAt:"desc"}}),
  prisma.workOrderMaterial.findMany({where:{status:{in:["RESERVED","SHORTAGE"]}},select:{inventoryItemId:true,reservedQty:true}}),
 ]);
 const reservedByItem=new Map<string,number>();
 for(const row of reservations)reservedByItem.set(row.inventoryItemId,(reservedByItem.get(row.inventoryItemId)||0)+row.reservedQty);
 const low=items.filter(item=>item.quantity-(reservedByItem.get(item.id)||0)<=item.reorderLevel).length;
 const total=items.reduce((sum,item)=>sum+item.quantity,0);
 const reserved=reservations.reduce((sum,row)=>sum+row.reservedQty,0);
 return <div className="ru-page">
  <div className="admin-header"><div><h1>Inventory & Materials</h1><p>Stock, reservations, production usage, recipes, purchase receipts and waste in one material ledger.</p></div></div>
  <div className="admin-kpi-strip"><div><small>Tracked items</small><strong>{items.length}</strong></div><div><small>Low / reorder</small><strong>{low}</strong></div><div><small>Total on hand</small><strong>{total.toLocaleString()}</strong></div><div><small>Reserved for jobs</small><strong>{reserved.toLocaleString()}</strong></div><div><small>Material recipes</small><strong>{recipes.length}</strong></div></div>
  <InventoryManager
   items={items.map(item=>({id:item.id,sku:item.sku,name:item.name,category:item.category,unit:item.unit,quantity:item.quantity,reorderLevel:item.reorderLevel,reserved:reservedByItem.get(item.id)||0}))}
   products={products.map(product=>({id:product.id,name:product.name,slug:product.slug}))}
   recipes={recipes.map(recipe=>({id:recipe.id,productName:recipe.product.name,itemName:recipe.inventoryItem.name,unit:recipe.inventoryItem.unit,productionMethod:recipe.productionMethod,placement:recipe.placement,quantityPerUnit:recipe.quantityPerUnit,wastePercent:recipe.wastePercent}))}
  />
 </div>;
}
