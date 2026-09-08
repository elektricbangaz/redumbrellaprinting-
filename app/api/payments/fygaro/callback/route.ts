import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/order-status";

// Fygaro redirects here after a hosted-checkout payment attempt.
// TODO: verify Fygaro's webhook signature per their docs before trusting
// this callback in production — this stub trusts the reference + status params.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("reference");
  const status = url.searchParams.get("status");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (orderNumber && status === "paid") {
    await markOrderPaid(orderNumber, url.searchParams.get("transaction_id") || "FYGARO");
    return NextResponse.redirect(`${appUrl}/order/${orderNumber}`);
  }

  return NextResponse.redirect(`${appUrl}/`);
}
