import type { SignalResult } from '../types';
import { clampScore, splitParagraphs, splitSentences, tokenizeWords } from '../text';

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) {
    return 1;
  }

  const vowels = cleaned.match(/[aeiouy]+/g);
  const estimated = vowels?.length ?? 1;
  if (cleaned.endsWith('e') && estimated > 1) {
    return estimated - 1;
  }

  return Math.max(1, estimated);
}

function fleschReadingEase(text: string): number {
  const sentences = splitSentences(text);
  const words = tokenizeWords(text);
  if (sentences.length === 0 || words.length === 0) {
    return 60;
  }

  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  return 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
}

export function scoreReadabilityConsistency(text: string): SignalResult {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 2) {
    return {
      key: 'readabilityConsistency',
      label: 'Readability consistency',
      score: 50,
      evidence: 'Need multiple paragraphs to compare readability consistency.',
      flaggedSentenceIndexes: []
    };
  }

  const readability = paragraphs.map(fleschReadingEase);
  const mean = readability.reduce((sum, value) => sum + value, 0) / readability.length;
  const stdev = Math.sqrt(
    readability.reduce((sum, value) => sum + (value - mean) ** 2, 0) / readability.length
  );

  const aiLikelihood = clampScore((1 - Math.min(1, stdev / 22)) * 100);

  return {
    key: 'readabilityConsistency',
    label: 'Readability consistency',
    score: aiLikelihood,
    evidence: `Paragraph readability stdev ${stdev.toFixed(2)} (very consistent structure can be AI-like).`,
    flaggedSentenceIndexes: []
  };
}
