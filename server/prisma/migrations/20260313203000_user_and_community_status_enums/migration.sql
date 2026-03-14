-- Replace legacy boolean status fields with explicit enums.
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');
CREATE TYPE "CommunityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "User"
ADD COLUMN "status" "UserStatus";

UPDATE "User"
SET "status" = CASE
  WHEN "isActive" = false THEN 'INACTIVE'::"UserStatus"
  WHEN "isVerified" = false THEN 'PENDING'::"UserStatus"
  ELSE 'ACTIVE'::"UserStatus"
END;

ALTER TABLE "User"
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "User"
DROP COLUMN "isActive",
DROP COLUMN "isVerified";

ALTER TABLE "Community"
ADD COLUMN "status" "CommunityStatus";

UPDATE "Community"
SET "status" = CASE
  WHEN "isActive" = false THEN 'INACTIVE'::"CommunityStatus"
  ELSE 'ACTIVE'::"CommunityStatus"
END;

ALTER TABLE "Community"
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "Community"
DROP COLUMN "isActive";

DROP INDEX IF EXISTS "Community_isActive_idx";
CREATE INDEX "Community_status_idx" ON "Community"("status");
