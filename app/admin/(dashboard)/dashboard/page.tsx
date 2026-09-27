import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orders, workOrders, customers, products] = await Promise.all([
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.workOrder.findMany({
      include: { order: { include: { items: { include: { product: true } } } } },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const totals = {
    pending: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
    paid: orders.filter((o) => o.paymentStatus === "PAID" || o.status === "PAID").length,
    queued: workOrders.filter((w) => w.stage === "QUEUED").length,
    inProgress: workOrders.filter((w) => w.stage === "IN_PROGRESS").length,
    ready: orders.filter((o) => o.status === "READY_FOR_PICKUP").length,
  };

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p>Production, sales, and fulfillment overview.</p>
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginBottom: 24 }}>
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Today&apos;s overview</h3>
          <div className="admin-grid-2">
            <div className="admin-card" style={{ padding: 14 }}>
              <small style={{ color: "#666" }}>Orders pending</small>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totals.pending}</div>
            </div>
            <div className="admin-card" style={{ padding: 14 }}>
              <small style={{ color: "#666" }}>Queued</small>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totals.queued}</div>
            </div>
            <div className="admin-card" style={{ padding: 14 }}>
              <small style={{ color: "#666" }}>In production</small>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totals.inProgress}</div>
            </div>
            <div className="admin-card" style={{ padding: 14 }}>
              <small style={{ color: "#666" }}>Ready</small>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totals.ready}</div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Revenue snapshot</h3>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--red)" }}>{formatJMD(revenue)}</div>
          <p style={{ color: "#666", marginBottom: 0 }}>
            Based on the latest recorded orders in the system.
          </p>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Recent orders</h3>
          {orders.length === 0 ? (
            <div className="admin-empty">No orders yet.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                    </td>
                    <td>{order.customerName}</td>
                    <td>{formatJMD(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Production board</h3>
          {workOrders.length === 0 ? (
            <div className="admin-empty">No work orders queued.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((workOrder) => (
                  <tr key={workOrder.id}>
                    <td>{workOrder.workOrderNumber}</td>
                    <td>{workOrder.order.customerName}</td>
                    <td>{workOrder.stage.replaceAll("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: 24 }}>
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Recent customers</h3>
          {customers.length === 0 ? (
            <div className="admin-empty">No customers yet.</div>
          ) : (
            <table className="admin-table">
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name ?? customer.email}</td>
                    <td>{customer.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Product catalog</h3>
          {products.length === 0 ? (
            <div className="admin-empty">No products tracked.</div>
          ) : (
            <table className="admin-table">
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
