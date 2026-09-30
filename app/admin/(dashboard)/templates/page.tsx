import { prisma } from "@/lib/prisma";
import { TemplateManager } from "./TemplateManager";

export const dynamic="force-dynamic";

export default async function AdminTemplatesPage(){
  const [templates,designs]=await Promise.all([
    prisma.designTemplate.findMany({
      include:{product:true},
      orderBy:{updatedAt:"desc"},
      take:100,
    }),
    prisma.design.findMany({
      include:{product:true,customer:true},
      orderBy:{createdAt:"desc"},
      take:50,
    }),
  ]);
  return <div className="ru-page">
    <div className="admin-header"><div><h1>Templates</h1><p>Reusable artwork and repeat-production templates.</p></div></div>
    <div className="admin-kpi-strip">
      <div><small>Total templates</small><strong>{templates.length}</strong></div>
      <div><small>Active</small><strong>{templates.filter(t=>t.active).length}</strong></div>
      <div><small>Submitted designs</small><strong>{designs.length}</strong></div>
    </div>
    <TemplateManager
      templates={templates.map(t=>({
        id:t.id,name:t.name,description:t.description,active:t.active,
        previewImage:t.previewImage,productName:t.product?.name??null,
      }))}
      designs={designs.map(d=>({
        id:d.id,productName:d.product.name,
        customer:d.customer?.name??d.customer?.email??"Guest",
        previewImage:d.previewImage,
        createdAt:d.createdAt.toLocaleDateString(),
      }))}
    />
  </div>;
}
