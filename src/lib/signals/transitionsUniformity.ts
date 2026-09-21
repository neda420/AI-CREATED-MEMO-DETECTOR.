import type { SignalResult } from '../types';
import { clampScore, splitSentences, tokenizeWords } from '../text';

const TRANSITIONS = ['however', 'therefore', 'moreover', 'furthermore', 'additionally', 'consequently', 'meanwhile', 'thus'];

export function scoreTransitionsUniformity(text: string): SignalResult {
  const sentences = splitSentences(text);
  if (sentences.length < 3) {
    return {
      key: 'transitionsUniformity',
      label: 'Transitions & uniformity',
      score: 50,
      evidence: 'Not enough sentence count to score transitions and uniformity.',
      flaggedSentenceIndexes: []
    };
  }

  const lengths = sentences.map((sentence) => tokenizeWords(sentence).length).filter((value) => value > 0);
  const mean = lengths.reduce((sum, len) => sum + len, 0) / Math.max(1, lengths.length);
  const stdev = Math.sqrt(
    lengths.reduce((sum, len) => sum + (len - mean) ** 2, 0) / Math.max(1, lengths.length)
  );

  const transitionHits = sentences.filter((sentence) =>
    TRANSITIONS.some((word) => sentence.toLowerCase().includes(` ${word} `) || sentence.toLowerCase().startsWith(`${word} `))
  ).length;
  const transitionDensity = transitionHits / sentences.length;
  const uniformity = 1 - Math.min(1, stdev / Math.max(1, mean));

  const flaggedSentenceIndexes = sentences
    .map((sentence, index) => ({ sentence: sentence.toLowerCase(), index }))
    .filter((entry) => TRANSITIONS.some((word) => entry.sentence.includes(word)))
    .map((entry) => entry.index)
    .slice(0, 10);

  const aiLikelihood = clampScore((transitionDensity * 0.6 + uniformity * 0.4) * 100);

  return {
    key: 'transitionsUniformity',
    label: 'Transitions & uniformity',
    score: aiLikelihood,
    evidence: `Transition density ${(transitionDensity * 100).toFixed(2)}%, sentence-length uniformity ${(uniformity * 100).toFixed(2)}%.`,
    flaggedSentenceIndexes
  };
}
