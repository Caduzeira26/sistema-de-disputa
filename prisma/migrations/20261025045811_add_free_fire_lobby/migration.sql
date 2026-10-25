-- CreateEnum
CREATE TYPE "LobbyStage" AS ENUM ('QUALIFYING', 'FINAL');

-- AlterEnum
ALTER TYPE "SportType" ADD VALUE 'FREE_FIRE';

-- AlterEnum
ALTER TYPE "TournamentFormat" ADD VALUE 'LOBBY_LEAGUE';

-- CreateTable
CREATE TABLE "LobbyRound" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "stage" "LobbyStage" NOT NULL,
    "number" INTEGER NOT NULL,
    "groupId" TEXT,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyEntry" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "placement" INTEGER,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LobbyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LobbyRound_tournamentId_stage_idx" ON "LobbyRound"("tournamentId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyEntry_roundId_teamId_key" ON "LobbyEntry"("roundId", "teamId");

-- AddForeignKey
ALTER TABLE "LobbyRound" ADD CONSTRAINT "LobbyRound_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyRound" ADD CONSTRAINT "LobbyRound_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyEntry" ADD CONSTRAINT "LobbyEntry_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "LobbyRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyEntry" ADD CONSTRAINT "LobbyEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
