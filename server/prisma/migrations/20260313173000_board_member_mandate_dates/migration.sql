-- Replace generic endedAt with explicit mandate dates.
ALTER TABLE "CommunityBoardMember"
ADD COLUMN "mandateStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "mandateEndDate" TIMESTAMP(3);

-- Backfill from existing timestamps.
UPDATE "CommunityBoardMember"
SET "mandateStartDate" = COALESCE("createdAt", CURRENT_TIMESTAMP);

UPDATE "CommunityBoardMember"
SET "mandateEndDate" = "endedAt"
WHERE "endedAt" IS NOT NULL;

ALTER TABLE "CommunityBoardMember"
DROP COLUMN "endedAt";
