-- CreateEnum
CREATE TYPE "AlertChannelType" AS ENUM ('SLACK', 'DISCORD', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "AlertDeliveryStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "alertMinSeverity" "IncidentSeverity" NOT NULL DEFAULT 'HIGH',
ADD COLUMN     "alertsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AlertChannel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AlertChannelType" NOT NULL,
    "webhookUrl" TEXT,
    "botToken" TEXT,
    "chatId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minSeverity" "IncidentSeverity" NOT NULL DEFAULT 'HIGH',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" "AlertDeliveryStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertDelivery" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channelId" TEXT,
    "incidentId" TEXT,
    "channelName" TEXT NOT NULL,
    "channelType" "AlertChannelType" NOT NULL,
    "status" "AlertDeliveryStatus" NOT NULL,
    "message" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertChannel_organizationId_isEnabled_idx" ON "AlertChannel"("organizationId", "isEnabled");

-- CreateIndex
CREATE INDEX "AlertDelivery_organizationId_createdAt_idx" ON "AlertDelivery"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "AlertChannel" ADD CONSTRAINT "AlertChannel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDelivery" ADD CONSTRAINT "AlertDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDelivery" ADD CONSTRAINT "AlertDelivery_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "AlertChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
