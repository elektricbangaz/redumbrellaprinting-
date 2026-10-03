import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailNotification } from "@/lib/notifications";
import { formatJMD } from "@/lib/money";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status as string;
  const allowed = ["DRAFT", "SENT", "RECEIVED", "CANCELLED"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const actor = session.user.email ?? session.user.name ?? "Admin";

  const current = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { include: { inventoryItem: true } } } });
  if (!current) return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });
  if (current.status === "RECEIVED" && status !== "RECEIVED") {
    return NextResponse.json({ error: "A received PO cannot be reopened because stock has already been posted." }, { status: 409 });
  }
  if (current.status === "CANCELLED" && status === "RECEIVED") {
    return NextResponse.json({ error: "A cancelled PO cannot be received." }, { status: 409 });
  }

  const po = await prisma.$transaction(async (tx) => {
    if (status === "RECEIVED" && current.status !== "RECEIVED") {
      for (const item of current.items) {
        if (!item.inventoryItemId) continue;
        await tx.inventoryItem.update({ where: { id: item.inventoryItemId }, data: { quantity: { increment: item.quantity } } });
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            type: "PURCHASE_RECEIPT",
            quantity: item.quantity,
            note: `Received on ${current.poNumber}: ${item.description}`,
            changedBy: actor,
          },
        });
      }
    }
    return tx.purchaseOrder.update({
      where: { id },
      data: {
        status: status as "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED",
        ...(status === "RECEIVED" && current.status !== "RECEIVED" ? { receivedAt: new Date(), receivedBy: actor } : {}),
      },
      include: { items: true },
    });
  });

  if (status === "SENT" && current.status !== "SENT" && current.vendorEmail) {
    const lines = current.items.map((item) => `${item.quantity} × ${item.description} — ${formatJMD(item.lineTotal)}`).join("\n");
    try { await sendEmailNotification({
      event: "PURCHASE_ORDER_SENT",
      entityType: "PurchaseOrder",
      entityId: current.id,
      to: current.vendorEmail,
      subject: `Purchase Order ${current.poNumber} — Red Umbrella Printing`,
      message: `Hello ${current.vendorName},\n\nPlease process purchase order ${current.poNumber}.\n\n${lines}\n\nTotal: ${formatJMD(current.total)}\n\n${current.notes || ""}`,
    }); } catch (notificationError) { console.error("[notification] purchase order email failed", notificationError); }
  }

  return NextResponse.json({ ok: true, po });
}
