-- CreateEnum
CREATE TYPE "UserPreferredLanguage" AS ENUM ('EN', 'SV', 'BS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferredLanguage" "UserPreferredLanguage" NOT NULL DEFAULT 'EN';
