import type { PrismaClient } from "@prisma/client";
import type { AiProvider, VocabularyCardResult } from "../drills/drill.types.js";

export class VocabularyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiProvider: AiProvider
  ) {}

  async createVocabularyCard(userId: string, word: string, source = "manual") {
    const card = await this.aiProvider.createVocabularyCard({ userId, word });
    return this.saveVocabularyCard(userId, card, source);
  }

  async pickDueVocabularyItem(userId: string, now = new Date()) {
    return this.prisma.vocabularyItem.findFirst({
      where: {
        userId,
        status: "active",
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }]
      },
      orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }]
    });
  }

  async listLatestVocabularyItems(userId: string, limit = 20) {
    return this.prisma.vocabularyItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  async scheduleNextReview(vocabularyItemId: string, now = new Date()) {
    return this.prisma.vocabularyItem.update({
      where: { id: vocabularyItemId },
      data: { nextReviewAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
    });
  }

  async scheduleNextReviewByWord(userId: string, normalizedWord: string, now = new Date()) {
    return this.prisma.vocabularyItem.updateMany({
      where: { userId, normalizedWord, status: "active" },
      data: { nextReviewAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) }
    });
  }

  async saveVocabularyCard(userId: string, card: VocabularyCardResult, source = "manual") {
    const item = await this.prisma.vocabularyItem.create({
      data: {
        userId,
        word: card.word,
        normalizedWord: card.normalized_word,
        partOfSpeech: card.part_of_speech,
        meaningEn: card.meaning_en,
        translationRu: card.translation_ru,
        ipa: card.ipa,
        pronunciationHintRu: card.pronunciation_hint_ru,
        examples: card.examples,
        collocations: card.collocations,
        tags: card.tags,
        source,
        nextReviewAt: new Date()
      }
    });

    const family = await this.prisma.wordFamilyItem.create({
      data: {
        vocabularyItemId: item.id,
        baseWord: card.normalized_word,
        verb: card.word_family.verb,
        noun: card.word_family.noun,
        adjective: card.word_family.adjective,
        adverb: card.word_family.adverb,
        phrases: card.word_family.phrases ?? [],
        examples: card.word_family.examples ?? []
      }
    });

    await Promise.all([
      this.prisma.aiLog.create({
        data: {
          userId,
          purpose: "vocabulary_card",
          promptName: "vocabulary_card_prompt_v1",
          promptVersion: "v1",
          inputSummary: card.word,
          outputJson: card,
          validationStatus: "valid",
          model: "ai_provider"
        }
      }),
      this.prisma.usageLog.create({
        data: {
          userId,
          provider: "openai",
          operation: "vocabulary_card",
          units: 1
        }
      })
    ]);

    return { item, family, card };
  }
}
