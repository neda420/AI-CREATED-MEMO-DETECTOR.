import { SIGNAL_WEIGHTS } from '../config/weights';
import { scoreAiPhrases } from './signals/aiPhrases';
import { scoreBurstiness } from './signals/burstiness';
import { scoreContractionTypo } from './signals/contractionTypo';
import { scoreLexicalDiversity } from './signals/lexicalDiversity';
import { scoreReadabilityConsistency } from './signals/readabilityConsistency';
import { scoreRepetition } from './signals/repetition';
import { scoreTransitionsUniformity } from './signals/transitionsUniformity';
import { clampScore, normalizeWhitespace, splitSentences } from './text';
import type { DetectorResult, SignalContribution, SignalResult } from './types';

function getConfidenceBand(contributions: SignalContribution[]): 'low' | 'medium' | 'high' {
  const spread = Math.max(...contributions.map((item) => item.score)) - Math.min(...contributions.map((item) => item.score));
  if (spread < 18) {
    return 'high';
  }

  if (spread < 35) {
    return 'medium';
  }

  return 'low';
}

function buildSummary(score: number): string {
  if (score < 34) {
    return 'Reads more like human writing';
  }

  if (score > 66) {
    return 'Reads more like AI writing';
  }

  return 'Mixed / inconclusive';
}

export function runDetection(rawText: string): DetectorResult {
  const text = normalizeWhitespace(rawText);
  const signalResults: SignalResult[] = [
    scoreBurstiness(text),
    scoreLexicalDiversity(text),
    scoreRepetition(text),
    scoreAiPhrases(text),
    scoreContractionTypo(text),
    scoreTransitionsUniformity(text),
    scoreReadabilityConsistency(text)
  ];

  const contributions: SignalContribution[] = signalResults.map((signal) => {
    const weight = SIGNAL_WEIGHTS[signal.key];
    return {
      ...signal,
      weight,
      contribution: signal.score * weight
    };
  });

  const overallScore = clampScore(contributions.reduce((sum, item) => sum + item.contribution, 0));
  const sentences = splitSentences(text);
  const flaggedSentences = contributions.flatMap((signal) =>
    signal.flaggedSentenceIndexes
      .filter((index) => sentences[index])
      .map((sentenceIndex) => ({
        sentenceIndex,
        sentence: sentences[sentenceIndex] ?? '',
        signal: signal.key,
        label: signal.label
      }))
  );

  return {
    overallScore,
    confidenceBand: getConfidenceBand(contributions),
    summary: buildSummary(overallScore),
    contributions,
    flaggedSentences
  };
}
