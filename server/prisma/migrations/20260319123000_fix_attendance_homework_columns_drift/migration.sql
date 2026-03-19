-- Self-heal schema drift for deployments that missed attendance homework columns.
ALTER TABLE "Attendance"
ADD COLUMN IF NOT EXISTS "homeworkTitle" TEXT;

ALTER TABLE "Attendance"
ADD COLUMN IF NOT EXISTS "homeworkDescription" TEXT;
