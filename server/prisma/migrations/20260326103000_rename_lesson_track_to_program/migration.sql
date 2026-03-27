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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'ChildProgramEnrollment'
      AND c.conname = 'ChildTrackEnrollment_pkey'
  ) THEN
    EXECUTE 'ALTER TABLE "ChildProgramEnrollment" RENAME CONSTRAINT "ChildTrackEnrollment_pkey" TO "ChildProgramEnrollment_pkey"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'ChildProgramEnrollment'
      AND c.conname = 'ChildTrackEnrollment_childId_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE "ChildProgramEnrollment" RENAME CONSTRAINT "ChildTrackEnrollment_childId_fkey" TO "ChildProgramEnrollment_childId_fkey"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = 'ChildTrackEnrollment_track_idx'
  ) THEN
    EXECUTE 'ALTER INDEX "ChildTrackEnrollment_track_idx" RENAME TO "ChildProgramEnrollment_program_idx"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = 'Lesson_track_nivo_title_idx'
  ) THEN
    EXECUTE 'ALTER INDEX "Lesson_track_nivo_title_idx" RENAME TO "Lesson_program_nivo_title_idx"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = 'Lesson_title_track_nivo_key'
  ) THEN
    EXECUTE 'ALTER INDEX "Lesson_title_track_nivo_key" RENAME TO "Lesson_title_program_nivo_key"';
  END IF;
END $$;
