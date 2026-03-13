-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "ssn" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ssn" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Child_ssn_key" ON "Child"("ssn");

-- CreateIndex
CREATE UNIQUE INDEX "User_ssn_key" ON "User"("ssn");
