-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('START', 'PRO', 'LIGA');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('MONTHLY', 'PER_TOURNAMENT');

-- CreateEnum
CREATE TYPE "PixTransactionKind" AS ENUM ('TEAM_REGISTRATION', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PixTransactionStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELED');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "registrationFeeCents" INTEGER;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" "PaymentType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PixTransaction" (
    "id" TEXT NOT NULL,
    "kind" "PixTransactionKind" NOT NULL,
    "tournamentId" TEXT,
    "teamId" TEXT,
    "subscriptionId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
    "status" "PixTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "txid" TEXT NOT NULL,
    "qrCode" TEXT,
    "qrCodeImageBase64" TEXT,
    "locId" INTEGER,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PixTransaction_teamId_key" ON "PixTransaction"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PixTransaction_txid_key" ON "PixTransaction"("txid");

-- CreateIndex
CREATE INDEX "PixTransaction_status_idx" ON "PixTransaction"("status");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixTransaction" ADD CONSTRAINT "PixTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
