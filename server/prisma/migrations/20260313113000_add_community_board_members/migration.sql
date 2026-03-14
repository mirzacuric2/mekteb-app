-- CreateEnum
CREATE TYPE "BoardMemberRole" AS ENUM ('IMAM', 'CHAIRPERSON', 'SECRETARY', 'TREASURER', 'MEMBER', 'ADVISOR');

-- CreateTable
CREATE TABLE "CommunityBoardMember" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "role" "BoardMemberRole" NOT NULL,
    "userId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "notes" TEXT,
    "addressId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityBoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityBoardMember_communityId_userId_key" ON "CommunityBoardMember"("communityId", "userId");

-- CreateIndex
CREATE INDEX "CommunityBoardMember_communityId_idx" ON "CommunityBoardMember"("communityId");

-- CreateIndex
CREATE INDEX "CommunityBoardMember_userId_idx" ON "CommunityBoardMember"("userId");

-- AddForeignKey
ALTER TABLE "CommunityBoardMember" ADD CONSTRAINT "CommunityBoardMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBoardMember" ADD CONSTRAINT "CommunityBoardMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBoardMember" ADD CONSTRAINT "CommunityBoardMember_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
