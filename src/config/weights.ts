import type { SignalKey } from '../lib/types';

export const SIGNAL_WEIGHTS: Record<SignalKey, number> = {
  burstiness: 0.16,
  lexicalDiversity: 0.16,
  repetition: 0.14,
  aiPhrases: 0.16,
  contractionTypo: 0.12,
  transitionsUniformity: 0.14,
  readabilityConsistency: 0.12
};
