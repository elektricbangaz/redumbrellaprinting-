import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDesignApprovalsPage() {
  const designs = await prisma.design.findMany({
    include: { product: true, customer: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Design Approvals</h1>
          <p>Review customer artwork, proofs and print readiness.</p>
        </div>
      </div>

      <div className="admin-card">
        {designs.length === 0 ? (
          <div className="admin-empty">No designs pending review.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Design</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design) => (
                <tr key={design.id}>
                  <td>
                    <Link href={`/admin/design-approvals/${design.id}`}>{design.id.slice(-8).toUpperCase()}</Link>
                  </td>
                  <td>{design.customer?.name ?? design.customer?.email ?? "—"}</td>
                  <td>{design.product.name}</td>
                  <td>{design.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
