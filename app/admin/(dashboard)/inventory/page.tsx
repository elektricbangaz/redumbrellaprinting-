import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Inventory</h1>
          <p>Catalog, material availability, and production stock.</p>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Slug</th>
              <th>Category</th>
              <th>Status</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.slug}</td>
                <td>{product.category ?? "General"}</td>
                <td>{product.active ? "Active" : "Inactive"}</td>
                <td>{product.basePrice ? `$${product.basePrice}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
