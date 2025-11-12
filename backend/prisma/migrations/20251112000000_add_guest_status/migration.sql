-- AlterTable
ALTER TABLE "guests" ADD COLUMN "session_id" TEXT;
ALTER TABLE "guests" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'yes';
ALTER TABLE "guests" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "guests" ALTER COLUMN "court_id" DROP NOT NULL;

-- Update existing guests to have session_id from their court
UPDATE "guests" g
SET "session_id" = c."session_id"
FROM "courts" c
WHERE g."court_id" = c."id";

-- Now make session_id NOT NULL since all existing records have been updated
ALTER TABLE "guests" ALTER COLUMN "session_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "guests_session_id_idx" ON "guests"("session_id");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ModifyForeignKey (change court relation to SET NULL instead of CASCADE)
ALTER TABLE "guests" DROP CONSTRAINT "guests_court_id_fkey";
ALTER TABLE "guests" ADD CONSTRAINT "guests_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

