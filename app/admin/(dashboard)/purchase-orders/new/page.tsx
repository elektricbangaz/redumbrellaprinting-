import { prisma } from "@/lib/prisma";
import { NewPurchaseOrderForm } from "./NewPurchaseOrderForm";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  const inventory = await prisma.inventoryItem.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  return <>
    <div className="admin-header"><div><h1>New Purchase Order</h1><p>Order blanks, ink, media or materials and post received stock directly into inventory.</p></div></div>
    <div className="admin-card"><NewPurchaseOrderForm inventory={inventory.map((item) => ({ id: item.id, sku: item.sku, name: item.name, unit: item.unit }))} /></div>
  </>;
}
