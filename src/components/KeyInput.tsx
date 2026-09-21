import type { LlmProvider } from '../lib/llm';

interface KeyInputProps {
  apiKey: string;
  provider: LlmProvider;
  onApiKeyChange: (value: string) => void;
  onProviderChange: (provider: LlmProvider) => void;
  onClear: () => void;
}

export function KeyInput({ apiKey, provider, onApiKeyChange, onProviderChange, onClear }: KeyInputProps) {
  return (
    <section className="space-y-2 rounded-xl border border-slate-300 p-4 dark:border-slate-700">
      <h2 className="text-lg font-semibold">Optional LLM second opinion (BYOK)</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Your key is stored only in this browser. Use a limited/scoped key and clear it on shared machines.
      </p>
      <label className="block text-sm">
        Provider
        <select
          className="mt-1 w-full rounded border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
          value={provider}
          onChange={(event) => onProviderChange(event.target.value as LlmProvider)}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </label>
      <label className="block text-sm">
        API key
        <input
          className="mt-1 w-full rounded border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
          type="password"
          value={apiKey}
          placeholder="Paste your key"
          onChange={(event) => onApiKeyChange(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="rounded bg-slate-800 px-3 py-2 text-sm text-white dark:bg-slate-200 dark:text-slate-900"
        onClick={onClear}
      >
        Clear key
      </button>
    </section>
  );
}
