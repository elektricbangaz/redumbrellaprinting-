import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function norm(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export class MaterialShortageError extends Error {
  shortages: Array<{ name: string; required: number; available: number }>;
  constructor(shortages: Array<{ name: string; required: number; available: number }>) {
    super("Insufficient inventory for this production job.");
    this.name = "MaterialShortageError";
    this.shortages = shortages;
  }
}

export async function planWorkOrderMaterials(tx: Tx, workOrderId: string) {
  const job = await tx.workOrder.findUnique({
    where: { id: workOrderId },
    include: { order: { include: { items: true } } },
  });
  if (!job) return [];

  const productIds = [...new Set(job.order.items.map((item) => item.productId))];
  const recipes = await tx.inventoryRecipe.findMany({
    where: { productId: { in: productIds }, active: true },
    include: { inventoryItem: true },
  });

  const required = new Map<string, { qty: number; item: (typeof recipes)[number]["inventoryItem"] }>();
  for (const orderItem of job.order.items) {
    for (const recipe of recipes) {
      if (recipe.productId !== orderItem.productId) continue;
      if (recipe.productionMethod && norm(recipe.productionMethod) !== norm(job.productionMethod)) continue;
      if (recipe.placement && norm(recipe.placement) !== norm(job.placement)) continue;
      const qty = orderItem.quantity * recipe.quantityPerUnit * (1 + recipe.wastePercent / 100);
      const current = required.get(recipe.inventoryItemId);
      required.set(recipe.inventoryItemId, { qty: (current?.qty ?? 0) + qty, item: recipe.inventoryItem });
    }
  }

  const keep = [...required.keys()];
  await tx.workOrderMaterial.deleteMany({
    where: { workOrderId, ...(keep.length ? { inventoryItemId: { notIn: keep } } : {}) },
  });
  if (!keep.length) {
    await tx.workOrderMaterial.deleteMany({ where: { workOrderId } });
    return [];
  }

  for (const [inventoryItemId, entry] of required) {
    const alreadyReserved = await tx.workOrderMaterial.aggregate({
      where: {
        inventoryItemId,
        workOrderId: { not: workOrderId },
        status: "RESERVED",
      },
      _sum: { reservedQty: true },
    });
    const available = Math.max(0, entry.item.quantity - (alreadyReserved._sum.reservedQty ?? 0));
    const reservable = Math.min(entry.qty, available);
    const status = reservable + 0.000001 >= entry.qty ? "RESERVED" : "SHORTAGE";
    await tx.workOrderMaterial.upsert({
      where: { workOrderId_inventoryItemId: { workOrderId, inventoryItemId } },
      update: { requiredQty: entry.qty, reservedQty: reservable, status },
      create: { workOrderId, inventoryItemId, requiredQty: entry.qty, reservedQty: reservable, status },
    });
  }

  return tx.workOrderMaterial.findMany({
    where: { workOrderId },
    include: { inventoryItem: true },
    orderBy: { inventoryItem: { name: "asc" } },
  });
}

export async function consumeWorkOrderMaterials(tx: Tx, workOrderId: string, changedBy: string) {
  const materials = await planWorkOrderMaterials(tx, workOrderId);
  const shortages = materials
    .filter((material) => material.status === "SHORTAGE")
    .map((material) => ({
      name: material.inventoryItem.name,
      required: material.requiredQty,
      available: material.reservedQty,
    }));
  if (shortages.length) throw new MaterialShortageError(shortages);

  for (const material of materials) {
    const remaining = Math.max(0, material.requiredQty - material.consumedQty);
    if (remaining <= 0.000001) continue;
    const updated = await tx.inventoryItem.updateMany({
      where: { id: material.inventoryItemId, quantity: { gte: remaining } },
      data: { quantity: { decrement: remaining } },
    });
    if (updated.count !== 1) {
      const item = await tx.inventoryItem.findUnique({ where: { id: material.inventoryItemId } });
      throw new MaterialShortageError([{
        name: item?.name ?? "Inventory item",
        required: remaining,
        available: item?.quantity ?? 0,
      }]);
    }
    await tx.inventoryMovement.create({
      data: {
        inventoryItemId: material.inventoryItemId,
        type: "PRODUCTION_USE",
        quantity: -remaining,
        note: `Consumed by production job ${workOrderId}`,
        changedBy,
      },
    });
    await tx.workOrderMaterial.update({
      where: { id: material.id },
      data: { consumedQty: material.requiredQty, reservedQty: 0, status: "CONSUMED" },
    });
  }
  return materials;
}

export async function releaseWorkOrderMaterials(tx: Tx, workOrderId: string) {
  await tx.workOrderMaterial.updateMany({
    where: { workOrderId, status: { in: ["RESERVED", "SHORTAGE", "PLANNED"] } },
    data: { reservedQty: 0, status: "RELEASED" },
  });
}
