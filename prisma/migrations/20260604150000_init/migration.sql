-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DrillType" AS ENUM ('RU_TO_EN_SPEAKING', 'SHADOWING', 'VOCABULARY_IN_SPEECH', 'WORD_FAMILY_GYM', 'PATTERN_GYM', 'GRAMMAR_UPGRADE', 'THOUGHT_TRANSFORMER', 'REVIEW');

-- CreateEnum
CREATE TYPE "DrillSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DrillMode" AS ENUM ('VOICE', 'TEXT');

-- CreateEnum
CREATE TYPE "LanguageMode" AS ENUM ('ENGLISH_SPEECH', 'RUSSIAN_INPUT', 'AUTO');

-- CreateEnum
CREATE TYPE "UserStateKind" AS ENUM ('IDLE', 'WAITING_FOR_DRILL_ANSWER', 'WAITING_FOR_REPEAT', 'WAITING_FOR_WORD_INPUT', 'WAITING_FOR_LESSON_AFTER_INPUT', 'WAITING_FOR_THOUGHT_INPUT', 'WAITING_FOR_SHADOW_REPEAT', 'TEXT_MODE_ACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "englishLevel" TEXT,
    "goals" JSONB NOT NULL DEFAULT '[]',
    "preferredTopics" JSONB NOT NULL DEFAULT '[]',
    "dailyDrillCount" INTEGER NOT NULL DEFAULT 3,
    "firstWeekDrillCount" INTEGER NOT NULL DEFAULT 3,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '10:00',
    "feedbackStyle" TEXT NOT NULL DEFAULT 'normal_plus_sometimes_strict',
    "voiceFirst" BOOLEAN NOT NULL DEFAULT true,
    "textAllowed" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" "UserStateKind" NOT NULL DEFAULT 'IDLE',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DrillType" NOT NULL,
    "promptRu" TEXT NOT NULL,
    "promptEn" TEXT,
    "targetWords" JSONB NOT NULL DEFAULT '[]',
    "targetPatterns" JSONB NOT NULL DEFAULT '[]',
    "targetGrammar" JSONB NOT NULL DEFAULT '[]',
    "topic" TEXT,
    "difficulty" TEXT,
    "source" TEXT NOT NULL,
    "expectedAnswerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Drill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrillSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "status" "DrillSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "mode" "DrillMode" NOT NULL DEFAULT 'VOICE',
    "languageMode" "LanguageMode" NOT NULL DEFAULT 'ENGLISH_SPEECH',
    "scheduledRepId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DrillSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drillSessionId" TEXT NOT NULL,
    "voiceFileId" TEXT,
    "audioUrl" TEXT,
    "userText" TEXT,
    "transcription" TEXT,
    "feedbackJson" JSONB,
    "meaningScore" INTEGER,
    "grammarScore" INTEGER,
    "naturalnessScore" INTEGER,
    "pronunciationScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "purpose" TEXT NOT NULL,
    "promptName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputSummary" TEXT NOT NULL,
    "outputJson" JSONB,
    "validationStatus" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensInput" INTEGER,
    "tokensOutput" INTEGER,
    "costUsd" DECIMAL(10,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "estimatedCostUsd" DECIMAL(10,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "UserState_userId_key" ON "UserState"("userId");

-- CreateIndex
CREATE INDEX "UserState_userId_idx" ON "UserState"("userId");

-- CreateIndex
CREATE INDEX "Drill_userId_idx" ON "Drill"("userId");

-- CreateIndex
CREATE INDEX "DrillSession_userId_idx" ON "DrillSession"("userId");

-- CreateIndex
CREATE INDEX "DrillSession_status_idx" ON "DrillSession"("status");

-- CreateIndex
CREATE INDEX "Attempt_userId_idx" ON "Attempt"("userId");

-- CreateIndex
CREATE INDEX "Attempt_drillSessionId_idx" ON "Attempt"("drillSessionId");

-- CreateIndex
CREATE INDEX "AiLog_userId_idx" ON "AiLog"("userId");

-- CreateIndex
CREATE INDEX "UsageLog_userId_createdAt_idx" ON "UsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_userId_createdAt_idx" ON "EventLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserState" ADD CONSTRAINT "UserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drill" ADD CONSTRAINT "Drill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillSession" ADD CONSTRAINT "DrillSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillSession" ADD CONSTRAINT "DrillSession_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_drillSessionId_fkey" FOREIGN KEY ("drillSessionId") REFERENCES "DrillSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiLog" ADD CONSTRAINT "AiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
