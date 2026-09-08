import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";
import { PayStubActions } from "./PayStubActions";

export default async function PayStubPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ provider?: string }>;
}) {
  const { orderNumber } = await params;
  const { provider } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  if (order.paymentStatus === "PAID") {
    return (
      <div className="page-shell">
        <div className="admin-card" style={{ maxWidth: 480, margin: "60px auto" }}>
          <h2>This order is already paid.</h2>
          <p>
            <a href={`/order/${order.orderNumber}`}>View your order confirmation →</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="admin-card" style={{ maxWidth: 480, margin: "60px auto" }}>
        <h2>Complete payment with {provider === "FYGARO" ? "Fygaro" : "WiPay"}</h2>
        <p style={{ color: "#666", fontSize: 13 }}>
          Order <strong>{order.orderNumber}</strong> — total{" "}
          <strong>{formatJMD(order.total)}</strong>
        </p>
        <p style={{ color: "#666", fontSize: 13 }}>
          Live {provider === "FYGARO" ? "Fygaro" : "WiPay"} merchant credentials have not
          been configured yet, so this is a placeholder checkout screen. Once real API
          keys are added (see <code>.env</code>), shoppers will be sent to the provider&apos;s
          hosted payment page automatically.
        </p>
        <PayStubActions orderNumber={order.orderNumber} />
      </div>
    </div>
  );
}
