import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Products</h1>
          <p>{products.length} catalog item{products.length === 1 ? "" : "s"} tracked</p>
        </div>
      </div>

      <div className="admin-card">
        {products.length === 0 ? (
          <div className="admin-empty">No products in the catalog yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Price</th>
                <th>Sizes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.slug}</td>
                  <td>{product.category}</td>
                  <td>{formatJMD(product.basePrice)}</td>
                  <td>{Array.isArray(product.sizes) ? product.sizes.length : 0}</td>
                  <td>
                    <span className={`badge ${product.active ? "badge-green" : "badge-grey"}`}>
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
