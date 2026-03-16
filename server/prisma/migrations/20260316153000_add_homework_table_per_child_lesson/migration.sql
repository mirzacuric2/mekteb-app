-- Create homework table tied to child + lesson.
CREATE TABLE "Homework" (
    "childId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("childId","lessonId")
);

-- Backfill latest known homework state from attendance records.
INSERT INTO "Homework" ("childId", "lessonId", "done", "createdAt", "updatedAt")
SELECT DISTINCT ON ("childId", "lessonId")
  "childId",
  "lessonId",
  "homeworkDone" AS "done",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Attendance"
WHERE "lessonId" IS NOT NULL
  AND "homeworkDone" IS NOT NULL
ORDER BY "childId", "lessonId", "markedAt" DESC;

CREATE INDEX "Homework_lessonId_idx" ON "Homework"("lessonId");
CREATE INDEX "Homework_updatedAt_idx" ON "Homework"("updatedAt");

ALTER TABLE "Homework"
ADD CONSTRAINT "Homework_childId_fkey"
FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Homework"
ADD CONSTRAINT "Homework_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
