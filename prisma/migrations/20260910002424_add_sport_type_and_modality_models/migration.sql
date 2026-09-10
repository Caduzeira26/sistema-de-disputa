-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('FUTEBOL_CAMPO', 'FUTSAL', 'FUTEBOL_7', 'HANDEBOL', 'VOLEIBOL', 'BASQUETE', 'TENIS_DE_MESA');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "setNumber" INTEGER,
ALTER COLUMN "minute" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "sportType" "SportType" NOT NULL DEFAULT 'FUTEBOL_CAMPO';

-- CreateTable
CREATE TABLE "MatchSet" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "homePoints" INTEGER NOT NULL,
    "awayPoints" INTEGER NOT NULL,

    CONSTRAINT "MatchSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Basket" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,

    CONSTRAINT "Basket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foul" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "period" INTEGER NOT NULL,

    CONSTRAINT "Foul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableTennisGame" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "homePlayerIds" TEXT[],
    "awayPlayerIds" TEXT[],
    "winnerSide" "MatchSlot",

    CONSTRAINT "TableTennisGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableTennisSet" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "homePoints" INTEGER NOT NULL,
    "awayPoints" INTEGER NOT NULL,

    CONSTRAINT "TableTennisSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchSet_matchId_setNumber_key" ON "MatchSet"("matchId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TableTennisGame_matchId_gameNumber_key" ON "TableTennisGame"("matchId", "gameNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TableTennisSet_gameId_setNumber_key" ON "TableTennisSet"("gameId", "setNumber");

-- AddForeignKey
ALTER TABLE "MatchSet" ADD CONSTRAINT "MatchSet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Basket" ADD CONSTRAINT "Basket_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Basket" ADD CONSTRAINT "Basket_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Basket" ADD CONSTRAINT "Basket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foul" ADD CONSTRAINT "Foul_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foul" ADD CONSTRAINT "Foul_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foul" ADD CONSTRAINT "Foul_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableTennisGame" ADD CONSTRAINT "TableTennisGame_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableTennisSet" ADD CONSTRAINT "TableTennisSet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TableTennisGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
