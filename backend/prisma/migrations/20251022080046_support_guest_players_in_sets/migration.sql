-- DropForeignKey
ALTER TABLE "set_scores" DROP CONSTRAINT "set_scores_user_id_fkey";

-- DropIndex
DROP INDEX "set_scores_set_id_user_id_key";

-- AlterTable
ALTER TABLE "set_scores" ADD COLUMN     "guest_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "set_scores_guest_id_idx" ON "set_scores"("guest_id");

-- AddForeignKey
ALTER TABLE "set_scores" ADD CONSTRAINT "set_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_scores" ADD CONSTRAINT "set_scores_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
