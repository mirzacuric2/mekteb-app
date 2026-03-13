-- CreateEnum
CREATE TYPE "Nivo" AS ENUM ('First', 'Second', 'Third', 'Fourth', 'Fifth');

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "nivo" "Nivo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_title_nivo_key" ON "Lesson"("title", "nivo");
