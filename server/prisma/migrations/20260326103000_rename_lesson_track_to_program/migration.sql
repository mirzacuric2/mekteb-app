DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LessonTrack') THEN
    EXECUTE 'ALTER TYPE "LessonTrack" RENAME TO "LessonProgram"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ChildTrackEnrollment') THEN
    EXECUTE 'ALTER TABLE "ChildTrackEnrollment" RENAME TO "ChildProgramEnrollment"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Lecture' AND column_name = 'track'
  ) THEN
    EXECUTE 'ALTER TABLE "Lecture" RENAME COLUMN "track" TO "program"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Lesson' AND column_name = 'track'
  ) THEN
    EXECUTE 'ALTER TABLE "Lesson" RENAME COLUMN "track" TO "program"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ChildProgramEnrollment' AND column_name = 'track'
  ) THEN
    EXECUTE 'ALTER TABLE "ChildProgramEnrollment" RENAME COLUMN "track" TO "program"';
  END IF;
END $$;

ALTER TABLE IF EXISTS "ChildProgramEnrollment"
  RENAME CONSTRAINT "ChildTrackEnrollment_pkey" TO "ChildProgramEnrollment_pkey";

ALTER TABLE IF EXISTS "ChildProgramEnrollment"
  RENAME CONSTRAINT "ChildTrackEnrollment_childId_fkey" TO "ChildProgramEnrollment_childId_fkey";

ALTER INDEX IF EXISTS "ChildTrackEnrollment_track_idx" RENAME TO "ChildProgramEnrollment_program_idx";
ALTER INDEX IF EXISTS "Lesson_track_nivo_title_idx" RENAME TO "Lesson_program_nivo_title_idx";
ALTER INDEX IF EXISTS "Lesson_title_track_nivo_key" RENAME TO "Lesson_title_program_nivo_key";
