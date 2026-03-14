ALTER TABLE "CommunityBoardMember"
ALTER COLUMN "role" TYPE TEXT;

UPDATE "CommunityBoardMember"
SET "role" = 'CHAIRPERSON'
WHERE "role" = 'IMAM';

DROP TYPE "BoardMemberRole";

CREATE TYPE "BoardMemberRole" AS ENUM (
  'CHAIRPERSON',
  'SECRETARY',
  'ECONOMY',
  'MEMBER',
  'ADVISOR'
);

ALTER TABLE "CommunityBoardMember"
ALTER COLUMN "role" TYPE "BoardMemberRole"
USING "role"::"BoardMemberRole";
