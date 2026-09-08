import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/order-status";

// WiPay redirects here after a hosted-checkout payment attempt.
// TODO: verify WiPay's response signature/hash per their docs before trusting
// this callback in production — this stub trusts the order_id + status params.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("order_id");
  const status = url.searchParams.get("status");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (orderNumber && status === "success") {
    await markOrderPaid(orderNumber, url.searchParams.get("transaction_id") || "WIPAY");
    return NextResponse.redirect(`${appUrl}/order/${orderNumber}`);
  }

  return NextResponse.redirect(`${appUrl}/`);
}
