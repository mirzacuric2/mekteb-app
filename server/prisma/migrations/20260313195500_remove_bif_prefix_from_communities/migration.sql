-- Remove legacy "BIF " prefix from community names.
UPDATE "Community"
SET
  "name" = regexp_replace("name", '^BIF\\s+', ''),
  "updatedAt" = NOW()
WHERE "name" LIKE 'BIF %';
