import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;
  return NextResponse.json(
    { error: "Order fulfillment status is managed by the production job queue. Update the linked job there to keep its history and order status synchronized." },
    { status: 409 }
  );
}
