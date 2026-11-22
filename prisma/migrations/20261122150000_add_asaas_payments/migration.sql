-- CreateEnum
CREATE TYPE "GatewayPaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'REFUNDED', 'CHARGEBACK', 'CANCELED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "cpfCnpj" TEXT;

-- CreateTable
CREATE TABLE "GatewayPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "billingType" TEXT,
    "status" "GatewayPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceUrl" TEXT NOT NULL,
    "bankSlipUrl" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatewayPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GatewayPayment_gatewayId_key" ON "GatewayPayment"("gatewayId");

-- CreateIndex
CREATE INDEX "GatewayPayment_status_idx" ON "GatewayPayment"("status");

-- CreateIndex
CREATE INDEX "GatewayPayment_subscriptionId_idx" ON "GatewayPayment"("subscriptionId");

-- AddForeignKey
ALTER TABLE "GatewayPayment" ADD CONSTRAINT "GatewayPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
