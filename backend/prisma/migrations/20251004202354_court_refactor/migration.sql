/*
  Warnings:

  - You are about to drop the column `booking_confirmation` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `booking_external_link` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `booking_status` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `booking_user_id` on the `sessions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_booking_user_id_fkey";

-- AlterTable
ALTER TABLE "rsvps" ADD COLUMN     "court_id" TEXT;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "booking_confirmation",
DROP COLUMN "booking_external_link",
DROP COLUMN "booking_status",
DROP COLUMN "booking_user_id",
ADD COLUMN     "number_of_courts" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
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

-- CreateIndex
CREATE INDEX "courts_session_id_idx" ON "courts"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "courts_session_id_court_number_key" ON "courts"("session_id", "court_number");

-- CreateIndex
CREATE INDEX "rsvps_court_id_idx" ON "rsvps"("court_id");

-- AddForeignKey
ALTER TABLE "courts" ADD CONSTRAINT "courts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
