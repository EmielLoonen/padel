-- Court Refactor Migration
-- This migration converts the booking system to a court-based model
-- WARNING: This will drop the old booking columns from sessions table

-- Step 1: Create Courts table
CREATE TABLE "courts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "court_number" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "max_players" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add numberOfCourts to sessions
ALTER TABLE "sessions" ADD COLUMN "number_of_courts" INTEGER NOT NULL DEFAULT 1;

-- Step 3: Add courtId to rsvps
ALTER TABLE "rsvps" ADD COLUMN "court_id" TEXT;

-- Step 4: Create indexes
CREATE UNIQUE INDEX "courts_session_id_court_number_key" ON "courts"("session_id", "court_number");
CREATE INDEX "courts_session_id_idx" ON "courts"("session_id");
CREATE INDEX "rsvps_court_id_idx" ON "rsvps"("court_id");

-- Step 5: Add foreign keys
ALTER TABLE "courts" ADD CONSTRAINT "courts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Remove old booking columns from sessions (CAREFUL!)
-- Uncomment these after backing up data
-- ALTER TABLE "sessions" DROP COLUMN "booking_status";
-- ALTER TABLE "sessions" DROP COLUMN "booking_user_id";
-- ALTER TABLE "sessions" DROP COLUMN "booking_confirmation";
-- ALTER TABLE "sessions" DROP COLUMN "booking_external_link";

-- Step 7: Remove SessionBooker relation from users (handled by dropping column above)

-- =========================================
-- DATA MIGRATION NOTES:
-- =========================================
-- After running this SQL:
-- 1. Run: cd backend && tsx prisma/migrate-courts.ts
--    This will create default courts for existing sessions
-- 2. Verify data looks correct
-- 3. Then run Step 6 (drop old columns) manually if you're confident

