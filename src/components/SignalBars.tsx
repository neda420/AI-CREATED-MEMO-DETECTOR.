import type { SignalContribution } from '../lib/types';

interface SignalBarsProps {
  contributions: SignalContribution[];
}

export function SignalBars({ contributions }: SignalBarsProps) {
  return (
    <div className="space-y-3">
      {contributions.map((signal) => (
        <div key={signal.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>{signal.label}</span>
            <span>{Math.round(signal.score)}</span>
          </div>
          <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
            <div className="h-2 rounded bg-indigo-500" style={{ width: `${signal.score}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{signal.evidence}</p>
        </div>
      ))}
    </div>
  );
}
