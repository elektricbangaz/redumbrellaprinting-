import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const invoices = orders.map((order) => ({
    id: order.id,
    invoiceNumber: order.orderNumber,
    customerName: order.customerName,
    total: order.total,
    status: order.paymentStatus,
    createdAt: order.createdAt,
  }));

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Invoices</h1>
          <p>Customer billing and payment reconciliation.</p>
        </div>
      </div>

      <div className="admin-card">
        {invoices.length === 0 ? (
          <div className="admin-empty">No invoices available.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.customerName}</td>
                  <td>{formatJMD(invoice.total)}</td>
                  <td>{invoice.status}</td>
                  <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
