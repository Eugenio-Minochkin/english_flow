-- CreateTable
CREATE TABLE "VocabularyItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "normalizedWord" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "meaningEn" TEXT NOT NULL,
    "translationRu" TEXT NOT NULL,
    "ipa" TEXT,
    "pronunciationHintRu" TEXT,
    "examples" JSONB NOT NULL DEFAULT '[]',
    "collocations" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextReviewAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VocabularyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordFamilyItem" (
    "id" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "baseWord" TEXT NOT NULL,
    "verb" TEXT,
    "noun" TEXT,
    "adjective" TEXT,
    "adverb" TEXT,
    "phrases" JSONB NOT NULL DEFAULT '[]',
    "examples" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WordFamilyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonImport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "parsedWords" JSONB NOT NULL DEFAULT '[]',
    "parsedTopics" JSONB NOT NULL DEFAULT '[]',
    "parsedErrors" JSONB NOT NULL DEFAULT '[]',
    "createdItems" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabularyItem_userId_normalizedWord_idx" ON "VocabularyItem"("userId", "normalizedWord");

-- CreateIndex
CREATE UNIQUE INDEX "WordFamilyItem_vocabularyItemId_key" ON "WordFamilyItem"("vocabularyItemId");

-- CreateIndex
CREATE INDEX "LessonImport_userId_createdAt_idx" ON "LessonImport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "VocabularyItem" ADD CONSTRAINT "VocabularyItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordFamilyItem" ADD CONSTRAINT "WordFamilyItem_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonImport" ADD CONSTRAINT "LessonImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
