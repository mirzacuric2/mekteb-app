-- Add nivo to lecture reports for level-scoped reporting
ALTER TABLE "Lecture"
ADD COLUMN "nivo" INTEGER;

-- Extend attendance with lesson and homework progress tracking
ALTER TABLE "Attendance"
ADD COLUMN "lessonId" TEXT,
ADD COLUMN "homeworkDone" BOOLEAN;

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Attendance_childId_markedAt_idx" ON "Attendance"("childId", "markedAt");
CREATE INDEX "Attendance_lessonId_idx" ON "Attendance"("lessonId");
