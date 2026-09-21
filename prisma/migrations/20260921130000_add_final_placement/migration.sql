-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "runnerUpTeamId" TEXT,
ADD COLUMN     "thirdPlaceTeamIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_runnerUpTeamId_key" ON "Tournament"("runnerUpTeamId");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_runnerUpTeamId_fkey" FOREIGN KEY ("runnerUpTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
