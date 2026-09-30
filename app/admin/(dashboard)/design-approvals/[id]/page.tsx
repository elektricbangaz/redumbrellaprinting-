import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DesignApprovalControls } from "./DesignApprovalControls";

export const dynamic="force-dynamic";

export default async function AdminDesignApprovalDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const design=await prisma.design.findUnique({
    where:{id},
    include:{product:true,customer:true,orderItems:{include:{order:true}}},
  });
  if(!design)notFound();

  return <div className="ru-page">
    <div className="admin-header"><div><h1>Design Review</h1><p>Approval and production decision for {design.id.slice(-8).toUpperCase()}.</p></div></div>
    <div className="admin-grid-2">
      <section className="admin-card">
        <h2>Artwork</h2>
        <div className="admin-settings-list">
          <div><span>Product</span><strong>{design.product.name}</strong></div>
          <div><span>Customer</span><strong>{design.customer?.name??design.customer?.email??"—"}</strong></div>
          <div><span>Submitted</span><strong>{design.createdAt.toLocaleString()}</strong></div>
          <div><span>Linked orders</span><strong>{new Set(design.orderItems.map(item=>item.orderId)).size}</strong></div>
        </div>
        {design.previewImage
          ? <img src={design.previewImage} alt="Design preview" className="design-review-preview"/>
          : <div className="admin-empty">No proof image attached.</div>}
      </section>
      <section className="admin-card">
        <h2>Production Approval</h2>
        <DesignApprovalControls id={design.id} status={design.approvalStatus} note={design.approvalNote}/>
        {design.approvedAt&&<p className="admin-data-note">Approved {design.approvedAt.toLocaleString()} by {design.approvedBy??"Admin"}.</p>}
      </section>
    </div>
  </div>;
}
