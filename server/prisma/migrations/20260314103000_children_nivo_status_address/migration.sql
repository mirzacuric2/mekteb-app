-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Child"
ADD COLUMN "nivo" "Nivo",
ADD COLUMN "status" "ChildStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "deactivatedAt" TIMESTAMP(3),
ADD COLUMN "addressId" TEXT;

-- Backfill nivo from legacy level values
UPDATE "Child"
SET "nivo" = CASE
  WHEN "level" IN ('1', 'First', 'first', 'FIRST') THEN 'First'::"Nivo"
  WHEN "level" IN ('2', 'Second', 'second', 'SECOND') THEN 'Second'::"Nivo"
  WHEN "level" IN ('3', 'Third', 'third', 'THIRD') THEN 'Third'::"Nivo"
  WHEN "level" IN ('4', 'Fourth', 'fourth', 'FOURTH') THEN 'Fourth'::"Nivo"
  WHEN "level" IN ('5', 'Fifth', 'fifth', 'FIFTH') THEN 'Fifth'::"Nivo"
  ELSE 'First'::"Nivo"
END;

ALTER TABLE "Child"
ALTER COLUMN "nivo" SET NOT NULL;

ALTER TABLE "Child"
DROP COLUMN "level";

-- AddForeignKey
ALTER TABLE "Child"
ADD CONSTRAINT "Child_addressId_fkey"
FOREIGN KEY ("addressId") REFERENCES "Address"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Child_communityId_status_idx" ON "Child"("communityId", "status");
