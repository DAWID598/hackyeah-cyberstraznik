-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'SAFE', 'THREAT');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'LOW',
    "aiVerdict" TEXT,
    "aiExplanation" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "organizationId" TEXT NOT NULL,
    "reportedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "threatType" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisStep" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepCompletion" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StepCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SecurityIncident_organizationId_createdAt_idx" ON "SecurityIncident"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_status_idx" ON "SecurityIncident"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CrisisStep_playbookId_order_key" ON "CrisisStep"("playbookId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "StepCompletion_stepId_organizationId_key" ON "StepCompletion"("stepId", "organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityIncident" ADD CONSTRAINT "SecurityIncident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityIncident" ADD CONSTRAINT "SecurityIncident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisStep" ADD CONSTRAINT "CrisisStep_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepCompletion" ADD CONSTRAINT "StepCompletion_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CrisisStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepCompletion" ADD CONSTRAINT "StepCompletion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
