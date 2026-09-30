import { prisma } from "@/lib/prisma";
import { InventoryManager } from "./InventoryManager";

export const dynamic="force-dynamic";

export default async function AdminInventoryPage(){
 const items=await prisma.inventoryItem.findMany({where:{active:true},orderBy:[{category:"asc"},{name:"asc"}]});
 const low=items.filter(item=>item.quantity<=item.reorderLevel).length;
 const total=items.reduce((sum,item)=>sum+item.quantity,0);
 return <div className="ru-page">
  <div className="admin-header"><div><h1>Inventory</h1><p>Production materials, stock levels, receipts, usage and waste.</p></div></div>
  <div className="admin-kpi-strip"><div><small>Tracked items</small><strong>{items.length}</strong></div><div><small>Low stock</small><strong>{low}</strong></div><div><small>Total units on hand</small><strong>{total.toLocaleString()}</strong></div></div>
  <InventoryManager items={items.map(item=>({id:item.id,sku:item.sku,name:item.name,category:item.category,unit:item.unit,quantity:item.quantity,reorderLevel:item.reorderLevel}))}/>
 </div>;
}
