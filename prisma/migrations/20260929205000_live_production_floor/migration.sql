ALTER TABLE "AdminUser"
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "hourlyRate" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "WorkOrder"
ADD COLUMN "productionPhase" TEXT NOT NULL DEFAULT 'PRE_PRESS',
ADD COLUMN "machine" TEXT,
ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastWorkedBy" TEXT,
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE TABLE "ProductionSession" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductionSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductionSession_workOrderId_startedAt_idx" ON "ProductionSession"("workOrderId", "startedAt");
CREATE INDEX "ProductionSession_staffId_startedAt_idx" ON "ProductionSession"("staffId", "startedAt");
CREATE INDEX "ProductionSession_active_idx" ON "ProductionSession"("active");

ALTER TABLE "ProductionSession"
ADD CONSTRAINT "ProductionSession_workOrderId_fkey"
FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductionSession"
ADD CONSTRAINT "ProductionSession_staffId_fkey"
FOREIGN KEY ("staffId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
