-- AlterTable: Change default value for can_create_sessions to false
-- Note: This only affects new rows. Existing rows are not changed.
ALTER TABLE "users" ALTER COLUMN "can_create_sessions" SET DEFAULT false;
