-- Preserve board-member history by soft-ending assignments instead of deleting rows.
ALTER TABLE "CommunityBoardMember"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "endedAt" TIMESTAMP(3);

-- Remove old uniqueness that prevented re-adding the same role assignment historically.
DROP INDEX IF EXISTS "CommunityBoardMember_communityId_userId_role_key";

CREATE INDEX "CommunityBoardMember_communityId_isActive_idx"
ON "CommunityBoardMember"("communityId", "isActive");

CREATE INDEX "CommunityBoardMember_communityId_role_isActive_idx"
ON "CommunityBoardMember"("communityId", "role", "isActive");

-- Ensure only one active linked-user assignment per role in a community.
CREATE UNIQUE INDEX "CommunityBoardMember_active_linked_assignment_unique"
ON "CommunityBoardMember"("communityId", "userId", "role")
WHERE "isActive" = true AND "userId" IS NOT NULL;
