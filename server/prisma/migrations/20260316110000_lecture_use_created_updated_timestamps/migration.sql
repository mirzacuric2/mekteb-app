-- Lecture timestamps now use createdAt/updatedAt only
ALTER TABLE "Lecture"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Lecture"
DROP COLUMN "heldAt";
