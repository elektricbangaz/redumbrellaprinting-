import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/order-status";

// Dev-only helper used by the internal payment stub page (/pay/[orderNumber])
// so the full order flow can be tested without live WiPay/Fygaro credentials.
// Real deployments should mark orders paid from the provider's webhook
// callback instead (see app/api/payments/*/callback).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const order = await markOrderPaid(orderNumber, `SIMULATED-${Date.now()}`);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
