import "./mobile.css";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { CORE_CATALOG } from "@/lib/catalog";
import { DesignerApp } from "./DesignerApp";
import type { DesignSurfaceId, SurfaceDesignState } from "@/lib/design-surfaces";
import type { SupplyMode } from "@/lib/designer-pricing";
import type { DecorationMethod } from "@/lib/design-document";

export const dynamic = "force-dynamic";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; template?: string }>;
}) {
  const sp = await searchParams;
  let products = CORE_CATALOG.map((p) => ({ ...p }));

  try {
    const synced = await Promise.all(
      CORE_CATALOG.map((item) =>
        prisma.product.upsert({
          where: { slug: item.slug },
          update: {
            name: item.name,
            category: item.category,
            description: item.description,
            basePrice: item.basePrice,
            colors: item.colors,
            sizes: item.sizes,
            images: item.images,
            active: true,
          },
          create: {
            name: item.name,
            slug: item.slug,
            category: item.category,
            description: item.description,
            basePrice: item.basePrice,
            colors: item.colors,
            sizes: item.sizes,
            images: item.images,
            active: true,
          },
        })
      )
    );

    products = synced.map((row) => {
      const source = CORE_CATALOG.find((p) => p.slug === row.slug)!;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        description: row.description || source.description,
        basePrice: row.basePrice,
        colors: row.colors as string[],
        sizes: row.sizes as string[],
        images: source.images,
        quoteOnly: source.quoteOnly ?? false,
        previewMode: source.previewMode,
      };
    });
  } catch (error) {
    console.error("Create Studio database unavailable; using resilient catalog.", error);
  }

  let initialTemplate:null|{
    productId:string;
    color:string;
    size:string;
    quantity:number;
    activeSurfaceId:DesignSurfaceId;
    surfaces:SurfaceDesignState;
    supplyMode:SupplyMode;
    decorationMethod:DecorationMethod;
  }=null;

  if(sp.template){
    const template=await prisma.designTemplate.findUnique({where:{id:sp.template}}).catch(()=>null);
    if(template?.active){
      const root=template.canvasData && typeof template.canvasData==="object" && !Array.isArray(template.canvasData)
        ? template.canvasData as Record<string,unknown>
        : {};
      const rawDocument=root.designDocument && typeof root.designDocument==="object" && !Array.isArray(root.designDocument)
        ? root.designDocument as Record<string,unknown>
        : root;
      const templateProductId=typeof rawDocument.productId==="string"
        ? rawDocument.productId
        : template.productId;
      const product=products.find(p=>p.id===templateProductId) || products.find(p=>p.id===template.productId) || null;
      if(product){
        initialTemplate={
          productId:product.id,
          color:typeof rawDocument.color==="string"?rawDocument.color:(product.colors[0]||"White"),
          size:typeof rawDocument.size==="string"?rawDocument.size:(product.sizes[0]||"Standard"),
          quantity:typeof rawDocument.quantity==="number"?Math.max(1,rawDocument.quantity):1,
          activeSurfaceId:(typeof rawDocument.activeSurfaceId==="string"?rawDocument.activeSurfaceId:"full-front") as DesignSurfaceId,
          surfaces:(rawDocument.surfaces && typeof rawDocument.surfaces==="object" && !Array.isArray(rawDocument.surfaces)
            ? rawDocument.surfaces
            : {}) as unknown as SurfaceDesignState,
          supplyMode:(rawDocument.supplyMode==="customer"?"customer":"red-umbrella") as SupplyMode,
          decorationMethod:(typeof rawDocument.decorationMethod==="string"?rawDocument.decorationMethod:"heat-transfer") as DecorationMethod,
        };
      }
    }
  }

  const selected = initialTemplate
    ? products.find(p=>p.id===initialTemplate.productId) || products[0]
    : products.find((p) => p.slug === sp.product) || products[0];

  return (
    <main className="sf create-app-page">
      <SiteHeader />
      <section className="designer-shell">
        <DesignerApp products={products} initialProductId={selected.id} initialTemplate={initialTemplate}/>
      </section>
    </main>
  );
}
