import type { SignalResult } from '../types';
import { clampScore, splitSentences, tokenizeWords } from '../text';

function variance(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
}

export function scoreBurstiness(text: string): SignalResult {
  const sentences = splitSentences(text);
  const lengths = sentences.map((sentence) => tokenizeWords(sentence).length).filter((value) => value > 0);

  if (lengths.length < 3) {
    return {
      key: 'burstiness',
      label: 'Burstiness',
      score: 50,
      evidence: 'Not enough sentence variation to score burstiness confidently.',
      flaggedSentenceIndexes: []
    };
  }

  const value = variance(lengths);
  const normalized = Math.min(1, value / 60);
  const aiLikelihood = clampScore((1 - normalized) * 100);

  const avgLength = lengths.reduce((sum, current) => sum + current, 0) / lengths.length;
  const flaggedSentenceIndexes = lengths
    .map((length, index) => ({ index, distance: Math.abs(length - avgLength) }))
    .filter((item) => item.distance < 2)
    .map((item) => item.index)
    .slice(0, 6);

  return {
    key: 'burstiness',
    label: 'Burstiness',
    score: aiLikelihood,
    evidence: `Sentence-length variance: ${value.toFixed(2)} (higher variance usually reads more human).`,
    flaggedSentenceIndexes
  };
}
