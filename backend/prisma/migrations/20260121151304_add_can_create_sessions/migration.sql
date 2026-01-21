-- AlterTable
-- Check if column exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'can_create_sessions'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "can_create_sessions" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;
