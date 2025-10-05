-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "team1_player1_id" TEXT NOT NULL,
    "team1_player2_id" TEXT NOT NULL,
    "team2_player1_id" TEXT NOT NULL,
    "team2_player2_id" TEXT NOT NULL,
    "team1_score" INTEGER NOT NULL,
    "team2_score" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_court_id_idx" ON "matches"("court_id");

-- CreateIndex
CREATE INDEX "matches_created_by_id_idx" ON "matches"("created_by_id");

-- CreateIndex
CREATE INDEX "matches_team1_player1_id_idx" ON "matches"("team1_player1_id");

-- CreateIndex
CREATE INDEX "matches_team1_player2_id_idx" ON "matches"("team1_player2_id");

-- CreateIndex
CREATE INDEX "matches_team2_player1_id_idx" ON "matches"("team2_player1_id");

-- CreateIndex
CREATE INDEX "matches_team2_player2_id_idx" ON "matches"("team2_player2_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_player1_id_fkey" FOREIGN KEY ("team1_player1_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_player2_id_fkey" FOREIGN KEY ("team1_player2_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_player1_id_fkey" FOREIGN KEY ("team2_player1_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_player2_id_fkey" FOREIGN KEY ("team2_player2_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
