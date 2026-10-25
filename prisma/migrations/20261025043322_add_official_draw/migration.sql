-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "pot" INTEGER;

-- CreateTable
CREATE TABLE "TournamentDraw" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "numGroups" INTEGER,
    "steps" JSONB NOT NULL,
    "revealed" INTEGER NOT NULL DEFAULT 0,
    "status" "DrawStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "TournamentDraw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentDraw_tournamentId_key" ON "TournamentDraw"("tournamentId");

-- AddForeignKey
ALTER TABLE "TournamentDraw" ADD CONSTRAINT "TournamentDraw_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
