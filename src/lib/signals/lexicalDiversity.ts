import type { SignalResult } from '../types';
import { clampScore, tokenizeWords } from '../text';

function movingAverageTtr(tokens: string[], windowSize: number): number {
  if (tokens.length <= windowSize) {
    return new Set(tokens).size / Math.max(1, tokens.length);
  }

  let sum = 0;
  let windows = 0;
  for (let i = 0; i + windowSize <= tokens.length; i += 1) {
    const window = tokens.slice(i, i + windowSize);
    sum += new Set(window).size / window.length;
    windows += 1;
  }

  return windows > 0 ? sum / windows : 0;
}

export function scoreLexicalDiversity(text: string): SignalResult {
  const tokens = tokenizeWords(text);
  if (tokens.length < 40) {
    return {
      key: 'lexicalDiversity',
      label: 'Lexical diversity',
      score: 50,
      evidence: 'Text too short for stable lexical-diversity metrics.',
      flaggedSentenceIndexes: []
    };
  }

  const ttr = new Set(tokens).size / tokens.length;
  const mattr = movingAverageTtr(tokens, Math.min(35, Math.max(10, Math.floor(tokens.length / 8))));
  const diversity = (ttr + mattr) / 2;
  const aiLikelihood = clampScore((0.7 - diversity) * 180);

  return {
    key: 'lexicalDiversity',
    label: 'Lexical diversity',
    score: aiLikelihood,
    evidence: `TTR=${ttr.toFixed(3)}, MATTR=${mattr.toFixed(3)}. Lower diversity can indicate templated prose.`,
    flaggedSentenceIndexes: []
  };
}
