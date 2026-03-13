-- AlterTable
ALTER TABLE "User"
ADD COLUMN "addressId" TEXT;

-- CreateIndex
CREATE INDEX "User_addressId_idx" ON "User"("addressId");

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
