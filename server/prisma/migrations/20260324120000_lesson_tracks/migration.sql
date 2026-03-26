-- CreateEnum
CREATE TYPE "LessonProgram" AS ENUM ('ILMIHAL', 'SUFARA', 'QURAN');

-- AlterEnum
ALTER TYPE "EventAudience" ADD VALUE IF NOT EXISTS 'ILMIHAL';
ALTER TYPE "EventAudience" ADD VALUE IF NOT EXISTS 'SUFARA';
ALTER TYPE "EventAudience" ADD VALUE IF NOT EXISTS 'QURAN';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "lessonText" TEXT;
ALTER TABLE "Lecture" ADD COLUMN "program" "LessonProgram" NOT NULL DEFAULT 'ILMIHAL';
ALTER TABLE "Lesson" ADD COLUMN "program" "LessonProgram" NOT NULL DEFAULT 'ILMIHAL';
ALTER TABLE "Lesson" ALTER COLUMN "nivo" SET DEFAULT 0;

-- DropIndex
DROP INDEX IF EXISTS "Lesson_title_nivo_key";

-- CreateTable
CREATE TABLE "ChildProgramEnrollment" (
    "childId" TEXT NOT NULL,
    "program" "LessonProgram" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildProgramEnrollment_pkey" PRIMARY KEY ("childId","program")
);

-- CreateIndex
CREATE INDEX "ChildProgramEnrollment_program_idx" ON "ChildProgramEnrollment"("program");
CREATE INDEX "Lesson_program_nivo_title_idx" ON "Lesson"("program", "nivo", "title");
CREATE UNIQUE INDEX "Lesson_title_program_nivo_key" ON "Lesson"("title", "program", "nivo");

-- AddForeignKey
ALTER TABLE "ChildProgramEnrollment" ADD CONSTRAINT "ChildProgramEnrollment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataBackfill
INSERT INTO "ChildProgramEnrollment" ("childId", "program")
SELECT "id", 'ILMIHAL'::"LessonProgram"
FROM "Child"
ON CONFLICT ("childId", "program") DO NOTHING;
