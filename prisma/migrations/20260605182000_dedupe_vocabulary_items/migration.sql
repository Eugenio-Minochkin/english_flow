WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "normalizedWord"
      ORDER BY "createdAt" ASC, id ASC
    ) AS row_number
  FROM "VocabularyItem"
)
DELETE FROM "WordFamilyItem"
WHERE "vocabularyItemId" IN (
  SELECT id FROM ranked WHERE row_number > 1
);

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "normalizedWord"
      ORDER BY "createdAt" ASC, id ASC
    ) AS row_number
  FROM "VocabularyItem"
)
DELETE FROM "VocabularyItem"
WHERE id IN (
  SELECT id FROM ranked WHERE row_number > 1
);

DROP INDEX IF EXISTS "VocabularyItem_userId_normalizedWord_idx";

CREATE UNIQUE INDEX "VocabularyItem_userId_normalizedWord_key"
ON "VocabularyItem"("userId", "normalizedWord");
