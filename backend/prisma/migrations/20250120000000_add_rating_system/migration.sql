-- AlterTable
ALTER TABLE "users" ADD COLUMN "rating" DECIMAL(5,2);
ALTER TABLE "users" ADD COLUMN "rating_updated_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "rating_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" DECIMAL(5,2) NOT NULL,
    "previous_rating" DECIMAL(5,2),
    "set_id" TEXT,
    "match_rating" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "match_rating" DECIMAL(5,2) NOT NULL,
    "expected_win_pct" DECIMAL(5,4) NOT NULL,
    "actual_win_pct" DECIMAL(5,4) NOT NULL,
    "match_weight" DECIMAL(5,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rating_history_user_id_idx" ON "rating_history"("user_id");
CREATE INDEX "rating_history_created_at_idx" ON "rating_history"("created_at");
CREATE INDEX "rating_history_set_id_idx" ON "rating_history"("set_id");
CREATE UNIQUE INDEX "match_ratings_user_id_set_id_key" ON "match_ratings"("user_id", "set_id");
CREATE INDEX "match_ratings_user_id_idx" ON "match_ratings"("user_id");
CREATE INDEX "match_ratings_set_id_idx" ON "match_ratings"("set_id");
CREATE INDEX "match_ratings_created_at_idx" ON "match_ratings"("created_at");

-- AddForeignKey
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "match_ratings" ADD CONSTRAINT "match_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_ratings" ADD CONSTRAINT "match_ratings_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;


