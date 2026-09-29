ALTER TABLE "AdminUser"
ADD COLUMN "passwordResetTokenHash" TEXT,
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordResetRequestedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "AdminUser_passwordResetTokenHash_key"
ON "AdminUser"("passwordResetTokenHash");