export function LimitationsNotice() {
  return (
    <aside className="rounded-lg border-2 border-rose-500 bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100">
      <strong>Important limitation:</strong> AI-text detection is probabilistic and unreliable. False positives
      and false negatives are common. This tool is an aid, not proof, and must never be the sole basis for
      accusations or high-stakes decisions.
    </aside>
  );
}
