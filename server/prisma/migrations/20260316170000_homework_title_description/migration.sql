ALTER TABLE "Homework"
ADD COLUMN "title" TEXT,
ADD COLUMN "description" TEXT;

UPDATE "Homework" h
SET "title" = l."title"
FROM "Lesson" l
WHERE h."lessonId" = l."id";

UPDATE "Homework"
SET "title" = 'Homework'
WHERE "title" IS NULL;

ALTER TABLE "Homework"
ALTER COLUMN "title" SET NOT NULL;
