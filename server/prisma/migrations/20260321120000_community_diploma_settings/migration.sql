-- AlterTable
ALTER TABLE "Community" ADD COLUMN "diplomaTemplatePdf" BYTEA,
ADD COLUMN "diplomaTemplateUpdatedAt" TIMESTAMP(3),
ADD COLUMN "diplomaLayoutJson" JSONB,
ADD COLUMN "diplomaDefaultImamLine" TEXT;
