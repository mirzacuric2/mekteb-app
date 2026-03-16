-- Add lecture completion lifecycle.
CREATE TYPE "LectureStatus" AS ENUM ('DRAFT', 'COMPLETED');

ALTER TABLE "Lecture"
ADD COLUMN "status" "LectureStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "Lecture_communityId_status_idx" ON "Lecture"("communityId", "status");
