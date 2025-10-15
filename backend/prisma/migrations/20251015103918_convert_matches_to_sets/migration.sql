/*
  Warnings:

  - You are about to drop the `matches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_court_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_team1_player1_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_team1_player2_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_team2_player1_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_team2_player2_id_fkey";

-- DropTable
DROP TABLE "matches";

-- CreateTable
CREATE TABLE "sets" (
    "id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_scores" (
    "id" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "games_won" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sets_court_id_idx" ON "sets"("court_id");

-- CreateIndex
CREATE INDEX "sets_created_by_id_idx" ON "sets"("created_by_id");

-- CreateIndex
CREATE INDEX "set_scores_set_id_idx" ON "set_scores"("set_id");

-- CreateIndex
CREATE INDEX "set_scores_user_id_idx" ON "set_scores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "set_scores_set_id_user_id_key" ON "set_scores"("set_id", "user_id");

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_scores" ADD CONSTRAINT "set_scores_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_scores" ADD CONSTRAINT "set_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
