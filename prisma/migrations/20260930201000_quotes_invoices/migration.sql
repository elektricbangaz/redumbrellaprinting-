CREATE TYPE "DesignApprovalStatus" AS ENUM ('PENDING','APPROVED','CHANGES_REQUESTED','REJECTED');
CREATE TYPE "QuoteStatus" AS ENUM ('REQUESTED','DRAFT','SENT','VIEWED','ACCEPTED','DECLINED','EXPIRED','CONVERTED','CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT','SENT','PARTIAL','PAID','OVERDUE','VOID');

CREATE TABLE "Quote" (
  "id" TEXT NOT NULL,
  "quoteNumber" TEXT NOT NULL,
  "publicToken" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "designId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'WEB',
  "status" "QuoteStatus" NOT NULL DEFAULT 'REQUESTED',
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT,
  "company" TEXT,
  "jobType" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "artworkUrl" TEXT,
  "budget" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "subtotal" INTEGER NOT NULL DEFAULT 0,
  "tax" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'JMD',
  "notes" TEXT,
  "convertedOrderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteItem" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" INTEGER NOT NULL DEFAULT 0,
  "lineTotal" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "publicToken" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "quoteId" TEXT,
  "orderId" TEXT,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3),
  "subtotal" INTEGER NOT NULL DEFAULT 0,
  "tax" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL DEFAULT 0,
  "amountPaid" INTEGER NOT NULL DEFAULT 0,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'JMD',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceItem" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" INTEGER NOT NULL DEFAULT 0,
  "lineTotal" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");
CREATE INDEX "Quote_status_createdAt_idx" ON "Quote"("status","createdAt");
CREATE INDEX "Quote_customerId_createdAt_idx" ON "Quote"("customerId","createdAt");
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "Invoice_publicToken_key" ON "Invoice"("publicToken");
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status","dueDate");
CREATE INDEX "Invoice_customerId_createdAt_idx" ON "Invoice"("customerId","createdAt");

ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;


CREATE TABLE "DesignTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "productId" TEXT,
  "canvasData" JSONB NOT NULL,
  "previewImage" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DesignTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'unit',
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "productId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "changedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "invoiceId" TEXT,
  "provider" "PaymentProvider",
  "reference" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'JMD',
  "status" "PaymentStatus" NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'SYSTEM',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX "DesignTemplate_productId_active_idx" ON "DesignTemplate"("productId","active");
CREATE INDEX "InventoryItem_category_active_idx" ON "InventoryItem"("category","active");
CREATE INDEX "InventoryMovement_inventoryItemId_createdAt_idx" ON "InventoryMovement"("inventoryItemId","createdAt");
CREATE INDEX "PaymentTransaction_orderId_createdAt_idx" ON "PaymentTransaction"("orderId","createdAt");
CREATE INDEX "PaymentTransaction_invoiceId_createdAt_idx" ON "PaymentTransaction"("invoiceId","createdAt");
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status","createdAt");

ALTER TABLE "DesignTemplate" ADD CONSTRAINT "DesignTemplate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "Design"
  ADD COLUMN "approvalStatus" "DesignApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "approvalNote" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedBy" TEXT;

ALTER TABLE "WorkOrder"
  ADD COLUMN "fulfillmentMethod" TEXT,
  ADD COLUMN "trackingNumber" TEXT,
  ADD COLUMN "handoffAt" TIMESTAMP(3),
  ADD COLUMN "handoffBy" TEXT;
