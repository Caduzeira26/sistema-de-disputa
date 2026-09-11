-- AlterTable
ALTER TABLE "AssistantConversation" ADD COLUMN     "context" TEXT NOT NULL DEFAULT 'SALES',
ADD COLUMN     "tournamentId" TEXT;

-- CreateIndex
CREATE INDEX "AssistantConversation_tournamentId_idx" ON "AssistantConversation"("tournamentId");

-- AddForeignKey
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
