CREATE TYPE "PracticeItemType" AS ENUM ('VOCABULARY', 'PHRASE', 'MISTAKE', 'PRONUNCIATION', 'PATTERN');
CREATE TYPE "PracticeItemStatus" AS ENUM ('WEAK', 'LEARNING', 'ACTIVE', 'MASTERED');

CREATE TABLE "PracticeItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "PracticeItemType" NOT NULL,
  "status" "PracticeItemStatus" NOT NULL DEFAULT 'WEAK',
  "promptRu" TEXT,
  "targetAnswerEn" TEXT,
  "betterVersionEn" TEXT,
  "sourceAttemptId" TEXT,
  "sourceVocabularyItemId" TEXT,
  "mistakeType" TEXT,
  "mistakeNoteRu" TEXT,
  "pronunciationTarget" TEXT,
  "nextReviewAt" TIMESTAMP(3),
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PracticeItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PracticeItem"
ADD CONSTRAINT "PracticeItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PracticeItem_userId_nextReviewAt_idx" ON "PracticeItem"("userId", "nextReviewAt");
CREATE INDEX "PracticeItem_userId_status_idx" ON "PracticeItem"("userId", "status");
CREATE INDEX "PracticeItem_sourceAttemptId_idx" ON "PracticeItem"("sourceAttemptId");
CREATE INDEX "PracticeItem_sourceVocabularyItemId_idx" ON "PracticeItem"("sourceVocabularyItemId");
