import type { PrismaClient } from "@prisma/client";
import type { VocabularyService } from "../vocabulary/vocabulary.service.js";

export function parseLessonWords(input: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const raw of input.split(/[\n,;]+/)) {
    const word = raw.trim().replace(/\s+/g, " ");
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export class LessonImportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly vocabularyService: VocabularyService
  ) {}

  async importLesson(userId: string, rawInput: string) {
    const words = parseLessonWords(rawInput);
    const createdCards = [];
    for (const word of words) {
      createdCards.push(await this.vocabularyService.createVocabularyCard(userId, word, "lesson_import"));
    }

    const lessonImport = await this.prisma.lessonImport.create({
      data: {
        userId,
        rawInput,
        parsedWords: words,
        createdItems: createdCards.map(({ item }) => item.id)
      }
    });

    return { words, createdCards, lessonImport };
  }
}
