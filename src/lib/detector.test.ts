import { runDetection } from './detector';
import { scoreAiPhrases } from './signals/aiPhrases';
import { scoreBurstiness } from './signals/burstiness';
import { scoreContractionTypo } from './signals/contractionTypo';
import { scoreLexicalDiversity } from './signals/lexicalDiversity';
import { scoreReadabilityConsistency } from './signals/readabilityConsistency';
import { scoreRepetition } from './signals/repetition';
import { scoreTransitionsUniformity } from './signals/transitionsUniformity';

const HUMANISH_TEXT = `I can't promise this plan is perfect, but it's practical. Yesterday we tried one route, then pivoted quickly when users got stuck.

Some paragraphs are dense; others are short. That uneven rhythm is intentional because the audience includes both engineers and non-technical managers.

We also left a typooo in a draft and fixed it later, which is normal in real writing.`;

const AIISH_TEXT = `Furthermore, it is important to note that this framework plays a crucial role in modern workflows. Moreover, this framework plays a crucial role in modern workflows. In conclusion, this framework plays a crucial role in modern workflows. Additionally, we navigate the complexities in today's world with a comprehensive tapestry of insights.`;

describe('signal scoring functions', () => {
  it('scores burstiness and lexical diversity in range', () => {
    expect(scoreBurstiness(HUMANISH_TEXT).score).toBeGreaterThanOrEqual(0);
    expect(scoreBurstiness(HUMANISH_TEXT).score).toBeLessThanOrEqual(100);
    expect(scoreLexicalDiversity(HUMANISH_TEXT).score).toBeGreaterThanOrEqual(0);
    expect(scoreLexicalDiversity(HUMANISH_TEXT).score).toBeLessThanOrEqual(100);
  });

  it('flags repetition and AI phrases higher for templated text', () => {
    expect(scoreRepetition(AIISH_TEXT).score).toBeGreaterThan(35);
    expect(scoreAiPhrases(AIISH_TEXT).score).toBeGreaterThan(35);
  });

  it('handles edge cases: empty, short, all-caps, non-english', () => {
    const empty = runDetection('');
    const short = runDetection('Too short text.');
    const allCaps = runDetection('THIS IS A VERY LOUD PARAGRAPH. THIS IS ALSO LOUD. STILL LOUD.');
    const nonEnglish = runDetection('これはテストです。これは別の文です。これはさらに別の文です。');

    [empty, short, allCaps, nonEnglish].forEach((result) => {
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  it('supports max-size input without throwing', () => {
    const block = 'This is one sentence with enough words to keep variety. ';
    const maxText = block.repeat(900);
    const result = runDetection(maxText);
    expect(result.contributions).toHaveLength(7);
    expect(result.flaggedSentences.length).toBeGreaterThanOrEqual(0);
  });

  it('provides stable outputs for remaining signal functions', () => {
    const signals = [
      scoreContractionTypo(HUMANISH_TEXT),
      scoreTransitionsUniformity(HUMANISH_TEXT),
      scoreReadabilityConsistency(HUMANISH_TEXT)
    ];

    signals.forEach((signal) => {
      expect(signal.score).toBeGreaterThanOrEqual(0);
      expect(signal.score).toBeLessThanOrEqual(100);
      expect(signal.evidence.length).toBeGreaterThan(0);
    });
  });
});
