interface GaugeProps {
  score: number;
  label: string;
}

function scoreColor(score: number): string {
  if (score < 34) return 'text-emerald-500';
  if (score > 66) return 'text-rose-500';
  return 'text-amber-500';
}

export function Gauge({ score, label }: GaugeProps) {
  return (
    <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
      <div
        role="progressbar"
        aria-label="AI-likelihood score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(score)}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">Heuristic estimate</p>
        <p className={`text-4xl font-bold ${scoreColor(score)}`}>{Math.round(score)}</p>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full bg-indigo-500" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
