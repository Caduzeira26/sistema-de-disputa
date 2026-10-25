-- AlterEnum
ALTER TYPE "LobbyStage" ADD VALUE 'HEAT';

-- AlterEnum
ALTER TYPE "TournamentFormat" ADD VALUE 'HEATS';

-- AlterTable
ALTER TABLE "LobbyEntry" ADD COLUMN     "score" INTEGER;

-- AlterTable
ALTER TABLE "LobbyRound" ADD COLUMN     "phase" INTEGER NOT NULL DEFAULT 1;
