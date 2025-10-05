/*
  Warnings:

  - You are about to drop the column `team1_score` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `team2_score` on the `matches` table. All the data in the column will be lost.
  - Added the required column `sets` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "team1_score",
DROP COLUMN "team2_score",
ADD COLUMN     "sets" TEXT NOT NULL;
