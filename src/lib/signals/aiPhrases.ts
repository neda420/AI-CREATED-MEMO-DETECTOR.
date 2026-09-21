import { AI_PHRASES } from '../../config/aiPhrases';
import type { SignalResult } from '../types';
import { clampScore, splitSentences } from '../text';

export function scoreAiPhrases(text: string): SignalResult {
  const lowered = text.toLowerCase();
  const sentences = splitSentences(text);
  const hits = AI_PHRASES.filter((phrase) => lowered.includes(phrase));
  const density = hits.length / Math.max(1, sentences.length);

  const flaggedSentenceIndexes = sentences
    .map((sentence, index) => ({ sentence: sentence.toLowerCase(), index }))
    .filter((entry) => AI_PHRASES.some((phrase) => entry.sentence.includes(phrase)))
    .map((entry) => entry.index);

  return {
    key: 'aiPhrases',
    label: 'AI tell phrases',
    score: clampScore(density * 280),
    evidence: hits.length > 0 ? `Found phrase cues: ${hits.join(', ')}.` : 'No listed AI tell phrases matched.',
    flaggedSentenceIndexes
  };
}
