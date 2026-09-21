import { splitSentences } from '../lib/text';
import type { FlaggedSentence } from '../lib/types';

interface HighlightedTextProps {
  text: string;
  flagged: FlaggedSentence[];
}

export function HighlightedText({ text, flagged }: HighlightedTextProps) {
  const sentenceFlags = flagged.reduce<Map<number, string[]>>((acc, item) => {
    const existing = acc.get(item.sentenceIndex) ?? [];
    acc.set(item.sentenceIndex, [...existing, item.label]);
    return acc;
  }, new Map());

  const sentences = splitSentences(text);

  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-slate-300 p-4 text-sm dark:border-slate-700">
      {sentences.map((sentence, index) => {
        const labels = sentenceFlags.get(index);
        if (!labels) {
          return <span key={`${index}-${sentence}`}>{sentence} </span>;
        }

        return (
          <mark
            key={`${index}-${sentence}`}
            className="rounded bg-amber-200 px-1 dark:bg-amber-800"
            title={`Flagged by: ${labels.join(', ')}`}
          >
            {sentence}{' '}
          </mark>
        );
      })}
    </div>
  );
}
