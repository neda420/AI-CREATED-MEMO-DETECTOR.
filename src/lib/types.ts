export type SignalKey =
  | 'burstiness'
  | 'lexicalDiversity'
  | 'repetition'
  | 'aiPhrases'
  | 'contractionTypo'
  | 'transitionsUniformity'
  | 'readabilityConsistency';

export interface SignalResult {
  key: SignalKey;
  label: string;
  score: number;
  evidence: string;
  flaggedSentenceIndexes: number[];
}

export interface SignalContribution extends SignalResult {
  weight: number;
  contribution: number;
}

export interface FlaggedSentence {
  sentenceIndex: number;
  sentence: string;
  signal: SignalKey;
  label: string;
}

export interface DetectorResult {
  overallScore: number;
  confidenceBand: 'low' | 'medium' | 'high';
  summary: string;
  contributions: SignalContribution[];
  flaggedSentences: FlaggedSentence[];
}
