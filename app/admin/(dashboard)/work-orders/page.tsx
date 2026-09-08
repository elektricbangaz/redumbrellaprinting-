import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkOrderStageSelect } from "@/components/admin/WorkOrderStageSelect";

const STAGES: { key: string; label: string }[] = [
  { key: "QUEUED", label: "Queued" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "QUALITY_CHECK", label: "Quality Check" },
  { key: "COMPLETED", label: "Completed" },
];

export default async function AdminWorkOrdersPage() {
  const workOrders = await prisma.workOrder.findMany({
    include: { order: { include: { items: { include: { product: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Work Orders</h1>
          <p>Production workflow board — {workOrders.length} active work orders</p>
        </div>
      </div>
      <div className="admin-kanban">
        {STAGES.map((stage) => (
          <div className="admin-kanban-col" key={stage.key}>
            <h3>
              {stage.label}
              <span>{workOrders.filter((w) => w.stage === stage.key).length}</span>
            </h3>
            {workOrders
              .filter((w) => w.stage === stage.key)
              .map((w) => (
                <div className="admin-kanban-card" key={w.id}>
                  <b>{w.workOrderNumber}</b>
                  <Link href={`/admin/orders/${w.orderId}`}>{w.order.orderNumber}</Link>
                  <span>{w.order.customerName}</span>
                  <span>
                    {w.order.items
                      .map((i) => `${i.product.name} ×${i.quantity}`)
                      .join(", ")}
                  </span>
                  <WorkOrderStageSelect id={w.id} stage={w.stage} />
                </div>
              ))}
            {workOrders.filter((w) => w.stage === stage.key).length === 0 && (
              <p style={{ fontSize: 11, color: "#999" }}>Nothing here.</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
