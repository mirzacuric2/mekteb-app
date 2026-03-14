-- Alter Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PARENT';

-- Rename board member enum values
ALTER TYPE "BoardMemberRole" RENAME VALUE 'CHAIRPERSON' TO 'PRESIDENT';
ALTER TYPE "BoardMemberRole" RENAME VALUE 'TREASURER' TO 'ECONOMY';

-- Allow same user to have multiple board roles
DROP INDEX IF EXISTS "CommunityBoardMember_communityId_userId_key";
CREATE UNIQUE INDEX "CommunityBoardMember_communityId_userId_role_key"
ON "CommunityBoardMember"("communityId", "userId", "role");
