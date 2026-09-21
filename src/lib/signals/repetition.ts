import type { SignalResult } from '../types';
import { clampScore, splitSentences, tokenizeWords } from '../text';

function ngramRatio(tokens: string[], size: number): number {
  if (tokens.length < size * 2) {
    return 0;
  }

  const seen = new Map<string, number>();
  for (let index = 0; index + size <= tokens.length; index += 1) {
    const gram = tokens.slice(index, index + size).join(' ');
    seen.set(gram, (seen.get(gram) ?? 0) + 1);
  }

  const repeated = Array.from(seen.values()).filter((count) => count > 1).length;
  return repeated / Math.max(1, seen.size);
}

export function scoreRepetition(text: string): SignalResult {
  const tokens = tokenizeWords(text);
  const sentences = splitSentences(text);
  const bi = ngramRatio(tokens, 2);
  const tri = ngramRatio(tokens, 3);

  const openers = sentences.map((sentence) => tokenizeWords(sentence).slice(0, 2).join(' ')).filter(Boolean);
  const openerCounts = openers.reduce<Map<string, number>>((acc, opener) => {
    acc.set(opener, (acc.get(opener) ?? 0) + 1);
    return acc;
  }, new Map());
  const repeatedOpeners = Array.from(openerCounts.entries()).filter(([, count]) => count > 1).map(([key]) => key);

  const repetitionLevel = bi * 0.45 + tri * 0.35 + (repeatedOpeners.length / Math.max(1, openers.length)) * 0.2;
  const aiLikelihood = clampScore(repetitionLevel * 220);

  const flaggedSentenceIndexes = sentences
    .map((sentence, index) => ({ index, opener: tokenizeWords(sentence).slice(0, 2).join(' ') }))
    .filter((entry) => repeatedOpeners.includes(entry.opener))
    .map((entry) => entry.index);

  return {
    key: 'repetition',
    label: 'Repetition patterns',
    score: aiLikelihood,
    evidence: `Repeated bi/trigrams ${(bi + tri).toFixed(3)}, repeated openers ${repeatedOpeners.length}.`,
    flaggedSentenceIndexes
  };
}
