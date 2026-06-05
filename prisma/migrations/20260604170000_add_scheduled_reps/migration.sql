-- CreateEnum
CREATE TYPE "ScheduledRepStatus" AS ENUM ('PLANNED', 'SENT', 'STARTED', 'SNOOZED', 'SKIPPED', 'COMPLETED', 'IGNORED', 'FAILED');

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "targetDrillCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledRep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyPlanId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "type" "DrillType" NOT NULL DEFAULT 'RU_TO_EN_SPEAKING',
    "status" "ScheduledRepStatus" NOT NULL DEFAULT 'PLANNED',
    "drillId" TEXT,
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScheduledRep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyPlan_userId_date_idx" ON "DailyPlan"("userId", "date");

-- CreateIndex
CREATE INDEX "ScheduledRep_userId_scheduledAt_idx" ON "ScheduledRep"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledRep_status_scheduledAt_idx" ON "ScheduledRep"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledRep" ADD CONSTRAINT "ScheduledRep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledRep" ADD CONSTRAINT "ScheduledRep_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
