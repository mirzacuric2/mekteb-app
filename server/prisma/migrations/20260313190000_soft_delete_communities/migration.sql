-- Soft-delete support for communities.
ALTER TABLE "Community"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deactivatedAt" TIMESTAMP(3);

CREATE INDEX "Community_isActive_idx" ON "Community"("isActive");
