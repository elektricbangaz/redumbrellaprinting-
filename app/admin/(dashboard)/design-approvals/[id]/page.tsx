import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDesignApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const design = await prisma.design.findUnique({
    where: { id },
    include: { product: true, customer: true },
  });

  if (!design) notFound();

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Design review</h1>
          <p>Approval and production decision for {design.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Artwork details</h3>
          <p>
            Product: {design.product.name}
            <br />
            Customer: {design.customer?.name ?? design.customer?.email ?? "—"}
            <br />
            Created: {design.createdAt.toLocaleDateString()}
          </p>
          {design.previewImage ? (
            <img
              src={design.previewImage}
              alt="Design preview"
              style={{ maxWidth: "100%", borderRadius: 12, border: "1px solid #ddd" }}
            />
          ) : (
            <div className="admin-empty">No proof image attached.</div>
          )}
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Approval status</h3>
          <p>Pending review by production team.</p>
          <ul>
            <li>Check placement accuracy</li>
            <li>Confirm colors match approved brief</li>
            <li>Validate final print size and margins</li>
          </ul>
        </div>
      </div>
    </>
  );
}
