import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 8 });
  return <>
    <div className="admin-header"><div><h1>Templates</h1><p>Reusable artwork and production template library.</p></div></div>
    <div className="admin-template-notice"><span><LayoutTemplate size={22}/></span><div><strong>Template library is not configured yet</strong><p>There is no saved-template model in the current system. Your live product catalog is available below; customer-submitted designs are under Artwork Review.</p><div><Link href="/catalog">Manage products</Link><Link href="/design-approvals">Review submitted artwork</Link></div></div></div>
    <div className="admin-header admin-subheader"><div><h2>Active products</h2><p>Products currently available to the storefront.</p></div></div>
    <div className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Sizes</th><th>Colors</th><th>Action</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.category}</td><td>{Array.isArray(product.sizes) ? product.sizes.join(", ") : "—"}</td><td>{Array.isArray(product.colors) ? product.colors.join(", ") : "—"}</td><td><Link href="/catalog">Open catalog</Link></td></tr>)}</tbody></table>{products.length === 0 && <div className="admin-empty">No active catalog products found.</div>}</div></div>
  </>;
}
