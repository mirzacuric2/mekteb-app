-- Convert Lesson.nivo from Nivo enum to integer
ALTER TABLE "Lesson" ALTER COLUMN "nivo" TYPE INTEGER USING
  CASE "nivo"::text
    WHEN 'First' THEN 1
    WHEN 'Second' THEN 2
    WHEN 'Third' THEN 3
    WHEN 'Fourth' THEN 4
    WHEN 'Fifth' THEN 5
  END;

-- Convert Child.nivo from Nivo enum to integer
ALTER TABLE "Child" ALTER COLUMN "nivo" TYPE INTEGER USING
  CASE "nivo"::text
    WHEN 'First' THEN 1
    WHEN 'Second' THEN 2
    WHEN 'Third' THEN 3
    WHEN 'Fourth' THEN 4
    WHEN 'Fifth' THEN 5
  END;

-- Drop the Nivo enum type
DROP TYPE "Nivo";
