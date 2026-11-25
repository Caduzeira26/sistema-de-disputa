-- CreateEnum
CREATE TYPE "GoalKind" AS ENUM ('NORMAL', 'DOUBLE_PHASE', 'CARD_DOUBLE', 'STAR_PLAYER', 'PENALTY', 'SHOOTOUT', 'MATCHBALL');

-- CreateEnum
CREATE TYPE "KingsEventType" AS ENUM ('SECRET_CARD', 'PRESIDENT_PENALTY', 'DICE');

-- CreateEnum
CREATE TYPE "SecretCard" AS ENUM ('GOL_X2', 'SUSPENSAO', 'JOGADOR_ESTRELA', 'SHOOTOUT', 'CORINGA', 'PENALTI_INVERSO', 'PENALTI');

-- AlterEnum
ALTER TYPE "SportType" ADD VALUE 'KINGS_LEAGUE';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "kind" "GoalKind" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "value" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "kingsFirstHalfMinutes" INTEGER,
ADD COLUMN     "kingsSecondHalfMinutes" INTEGER,
ADD COLUMN     "pointsShootoutLoss" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pointsShootoutWin" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "KingsEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "type" "KingsEventType" NOT NULL,
    "teamId" TEXT,
    "card" "SecretCard",
    "minute" INTEGER,
    "playerId" TEXT,
    "scored" BOOLEAN,
    "goalsAwarded" INTEGER NOT NULL DEFAULT 0,
    "diceResult" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KingsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KingsEvent_matchId_idx" ON "KingsEvent"("matchId");

-- AddForeignKey
ALTER TABLE "KingsEvent" ADD CONSTRAINT "KingsEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KingsEvent" ADD CONSTRAINT "KingsEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KingsEvent" ADD CONSTRAINT "KingsEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

