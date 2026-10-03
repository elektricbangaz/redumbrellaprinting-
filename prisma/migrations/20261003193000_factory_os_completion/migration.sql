ALTER TABLE "AdminUser"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "invitedAt" TIMESTAMP(3);

ALTER TABLE "WorkOrder"
  ADD COLUMN "assignedStaffId" TEXT,
  ADD COLUMN "workstationId" TEXT;

ALTER TABLE "PurchaseOrder"
  ADD COLUMN "receivedAt" TIMESTAMP(3),
  ADD COLUMN "receivedBy" TEXT;

ALTER TABLE "PurchaseOrderItem"
  ADD COLUMN "inventoryItemId" TEXT;

CREATE TABLE "Workstation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "area" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workstation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffShift" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "workstationId" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffClockEntry" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "workstationId" TEXT,
  "clockIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clockOut" TIMESTAMP(3),
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffClockEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryRecipe" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "productionMethod" TEXT,
  "placement" TEXT,
  "quantityPerUnit" DOUBLE PRECISION NOT NULL,
  "wastePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryRecipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkOrderMaterial" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "requiredQty" DOUBLE PRECISION NOT NULL,
  "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "consumedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkOrderMaterial_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL','WHATSAPP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING','SENT','SKIPPED','FAILED');

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "event" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "externalId" TEXT,
  "error" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workstation_name_key" ON "Workstation"("name");
CREATE INDEX "WorkOrder_assignedStaffId_stage_idx" ON "WorkOrder"("assignedStaffId","stage");
CREATE INDEX "WorkOrder_workstationId_stage_idx" ON "WorkOrder"("workstationId","stage");
CREATE INDEX "StaffShift_staffId_startsAt_idx" ON "StaffShift"("staffId","startsAt");
CREATE INDEX "StaffShift_workstationId_startsAt_idx" ON "StaffShift"("workstationId","startsAt");
CREATE INDEX "StaffClockEntry_staffId_clockIn_idx" ON "StaffClockEntry"("staffId","clockIn");
CREATE INDEX "StaffClockEntry_clockOut_idx" ON "StaffClockEntry"("clockOut");
CREATE INDEX "InventoryRecipe_productId_active_idx" ON "InventoryRecipe"("productId","active");
CREATE INDEX "InventoryRecipe_inventoryItemId_active_idx" ON "InventoryRecipe"("inventoryItemId","active");
CREATE UNIQUE INDEX "WorkOrderMaterial_workOrderId_inventoryItemId_key" ON "WorkOrderMaterial"("workOrderId","inventoryItemId");
CREATE INDEX "WorkOrderMaterial_status_workOrderId_idx" ON "WorkOrderMaterial"("status","workOrderId");
CREATE INDEX "Notification_event_createdAt_idx" ON "Notification"("event","createdAt");
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status","createdAt");
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType","entityId");

ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_workstationId_fkey" FOREIGN KEY ("workstationId") REFERENCES "Workstation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_workstationId_fkey" FOREIGN KEY ("workstationId") REFERENCES "Workstation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffClockEntry" ADD CONSTRAINT "StaffClockEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffClockEntry" ADD CONSTRAINT "StaffClockEntry_workstationId_fkey" FOREIGN KEY ("workstationId") REFERENCES "Workstation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryRecipe" ADD CONSTRAINT "InventoryRecipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryRecipe" ADD CONSTRAINT "InventoryRecipe_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrderMaterial" ADD CONSTRAINT "WorkOrderMaterial_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrderMaterial" ADD CONSTRAINT "WorkOrderMaterial_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "DesignStatus" AS ENUM ('PENDING','COMPLETE','CANCELLED');
ALTER TABLE "Design" ADD COLUMN "status" "DesignStatus" NOT NULL DEFAULT 'PENDING';
CREATE INDEX "Design_status_createdAt_idx" ON "Design"("status","createdAt");
