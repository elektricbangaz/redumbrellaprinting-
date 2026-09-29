ALTER TYPE "WorkOrderStage" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "WorkOrderStage" ADD VALUE IF NOT EXISTS 'REVIEW';
ALTER TYPE "WorkOrderStage" ADD VALUE IF NOT EXISTS 'NEEDS_CUSTOMER_APPROVAL';
ALTER TYPE "WorkOrderStage" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "WorkOrderStage" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "WorkOrderStage" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "WorkOrderStage" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "WorkOrder"
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "productionMethod" TEXT,
ADD COLUMN "placement" TEXT,
ADD COLUMN "blockedReason" TEXT;

CREATE TABLE "WorkOrderEvent" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "fromStage" "WorkOrderStage",
  "toStage" "WorkOrderStage" NOT NULL,
  "note" TEXT,
  "changedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkOrderEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkOrderEvent_workOrderId_fkey"
    FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WorkOrderEvent_workOrderId_createdAt_idx"
ON "WorkOrderEvent"("workOrderId", "createdAt");

INSERT INTO "WorkOrderEvent" ("id", "workOrderId", "fromStage", "toStage", "note", "createdAt")
SELECT 'woevt_' || md5("id" || "createdAt"::text), "id", NULL, "stage", 'Workflow history initialized during job queue rollout.', "createdAt"
FROM "WorkOrder";