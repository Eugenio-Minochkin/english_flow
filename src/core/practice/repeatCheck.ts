export type RepeatCheckResult = {
  success: boolean;
  score: number;
  missingWords: string[];
};

export function compareRepeatToTarget(transcript: string, target: string): RepeatCheckResult {
  const transcriptTokens = tokenize(transcript);
  const targetTokens = tokenize(target);
  if (targetTokens.length === 0) return { success: true, score: 1, missingWords: [] };

  const transcriptCounts = countTokens(transcriptTokens);
  let matched = 0;
  const missingWords: string[] = [];

  for (const token of targetTokens) {
    const count = transcriptCounts.get(token) ?? 0;
    if (count > 0) {
      matched += 1;
      transcriptCounts.set(token, count - 1);
    } else if (!missingWords.includes(token)) {
      missingWords.push(token);
    }
  }

  const score = matched / targetTokens.length;
  return { success: score >= 0.75, score, missingWords };
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function countTokens(tokens: string[]) {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}
