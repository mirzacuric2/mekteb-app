-- CreateEnum
CREATE TYPE "MessageContextType" AS ENUM ('GENERAL', 'HOMEWORK', 'LECTURE_COMMENT', 'ABSENCE_COMMENT');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageThreadStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Message"
ADD COLUMN "threadId" TEXT,
ADD COLUMN "kind" "MessageKind" NOT NULL DEFAULT 'USER',
ADD COLUMN "contextType" "MessageContextType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "contextChildId" TEXT,
ADD COLUMN "contextLectureId" TEXT,
ADD COLUMN "contextLabel" TEXT,
ADD COLUMN "contextPreview" TEXT,
ADD COLUMN "threadStatus" "MessageThreadStatus" NOT NULL DEFAULT 'OPEN';

-- Backfill threadId for existing rows
UPDATE "Message"
SET "threadId" = "id"
WHERE "threadId" IS NULL;

-- Enforce not-null after backfill
ALTER TABLE "Message"
ALTER COLUMN "threadId" SET NOT NULL;

-- Indexes
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");
CREATE INDEX "Message_receiverId_createdAt_idx" ON "Message"("receiverId", "createdAt");
