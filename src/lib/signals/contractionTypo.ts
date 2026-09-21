import type { SignalResult } from '../types';
import { clampScore, tokenizeWords } from '../text';

const CONTRACTIONS = ["can't", "won't", "don't", "i'm", "it's", "we're", "they're", "isn't", "didn't", "you're"];

export function scoreContractionTypo(text: string): SignalResult {
  const tokens = tokenizeWords(text);
  if (tokens.length < 30) {
    return {
      key: 'contractionTypo',
      label: 'Contractions & irregularity',
      score: 50,
      evidence: 'Text too short for contraction/irregularity profiling.',
      flaggedSentenceIndexes: []
    };
  }

  const contractionCount = tokens.filter((token) => CONTRACTIONS.includes(token)).length;
  const typoLikeCount = tokens.filter((token) => /(.)\1\1/.test(token) || /[a-z]{20,}/.test(token)).length;
  const contractionRate = contractionCount / tokens.length;
  const typoRate = typoLikeCount / tokens.length;

  const aiLikelihood = clampScore((0.04 - contractionRate) * 900 + (0.015 - typoRate) * 900);

  return {
    key: 'contractionTypo',
    label: 'Contractions & irregularity',
    score: aiLikelihood,
    evidence: `Contraction rate ${(contractionRate * 100).toFixed(2)}%, irregularity rate ${(typoRate * 100).toFixed(2)}%.`,
    flaggedSentenceIndexes: []
  };
}
