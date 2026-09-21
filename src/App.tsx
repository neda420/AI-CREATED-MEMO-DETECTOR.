import { useMemo, useState } from 'react';
import { FileDrop } from './components/FileDrop';
import { Gauge } from './components/Gauge';
import { HighlightedText } from './components/HighlightedText';
import { KeyInput } from './components/KeyInput';
import { LimitationsNotice } from './components/LimitationsNotice';
import { SignalBars } from './components/SignalBars';
import { requestLlmOpinion, type LlmOpinion, type LlmProvider } from './lib/llm';
import { MAX_INPUT_CHARS } from './lib/text';
import type { DetectorResult } from './lib/types';

const KEY_STORAGE = 'ai-memo-detector-key';
const PROVIDER_STORAGE = 'ai-memo-detector-provider';

const detectorWorker = new Worker(new URL('./lib/detector.worker.ts', import.meta.url), { type: 'module' });

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<DetectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [provider, setProvider] = useState<LlmProvider>(() => {
    const saved = localStorage.getItem(PROVIDER_STORAGE);
    return saved === 'anthropic' ? 'anthropic' : 'openai';
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? '');
  const [llmResult, setLlmResult] = useState<LlmOpinion | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  const textTooShort = text.trim().length > 0 && text.trim().length < 120;
  const textTooLarge = text.length > MAX_INPUT_CHARS;

  const canAnalyze = !loading && text.trim().length >= 120 && !textTooLarge;

  const privacyMessage = useMemo(
    () =>
      'Privacy: your text stays in your browser. Nothing is uploaded unless you explicitly run the optional LLM second opinion with your own key.',
    []
  );

  const analyze = (): void => {
    setError(null);
    setLlmResult(null);
    setLoading(true);

    detectorWorker.onmessage = (event: MessageEvent<{ ok: boolean; result?: DetectorResult; error?: string }>) => {
      setLoading(false);
      if (!event.data.ok || !event.data.result) {
        setResult(null);
        setError(event.data.error ?? 'Analysis failed.');
        return;
      }

      setResult(event.data.result);
    };

    detectorWorker.postMessage({ text });
  };

  const updateKey = (value: string): void => {
    setApiKey(value);
    if (value) {
      localStorage.setItem(KEY_STORAGE, value);
    } else {
      localStorage.removeItem(KEY_STORAGE);
    }
  };

  const updateProvider = (nextProvider: LlmProvider): void => {
    setProvider(nextProvider);
    localStorage.setItem(PROVIDER_STORAGE, nextProvider);
  };

  const clearKey = (): void => {
    setApiKey('');
    localStorage.removeItem(KEY_STORAGE);
  };

  const runLlmOpinion = async (): Promise<void> => {
    if (!result || !apiKey.trim()) {
      return;
    }

    setLlmLoading(true);
    setLlmError(null);
    setLlmResult(null);

    try {
      const opinion = await requestLlmOpinion({ key: apiKey, provider, text });
      setLlmResult(opinion);
    } catch (requestError) {
      setLlmError(requestError instanceof Error ? requestError.message : 'Failed to request LLM opinion.');
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <main className="min-h-screen bg-white px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">AI-Created Memo Detector</h1>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                onClick={() => setDarkMode((value) => !value)}
              >
                {darkMode ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Estimate whether writing reads more human-like or AI-like using transparent language signals.
            </p>
            <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              {privacyMessage}
            </p>
          </header>

          <section className="space-y-3 rounded-xl border border-slate-300 p-4 dark:border-slate-700">
            <label htmlFor="textInput" className="block text-sm font-medium">
              Paste memo/report/essay text
            </label>
            <textarea
              id="textInput"
              className="h-48 w-full rounded border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-900"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste text here..."
            />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} characters
            </p>
            {textTooShort ? <p className="text-sm text-amber-600">Enter at least 120 characters for analysis.</p> : null}
            {textTooLarge ? (
              <p className="text-sm text-rose-600">Text is too long. Please stay under {MAX_INPUT_CHARS.toLocaleString()} characters.</p>
            ) : null}

            <FileDrop
              onTextLoaded={(parsed) => {
                setText(parsed);
                setError(null);
              }}
              onError={setError}
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
                onClick={analyze}
                disabled={!canAnalyze}
              >
                {loading ? 'Analyzing…' : 'Analyze text'}
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
                onClick={() => {
                  setText('');
                  setResult(null);
                  setError(null);
                  setLlmResult(null);
                }}
              >
                Clear
              </button>
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </section>

          <KeyInput
            apiKey={apiKey}
            provider={provider}
            onApiKeyChange={updateKey}
            onProviderChange={updateProvider}
            onClear={clearKey}
          />

          {result ? (
            <section className="space-y-4">
              <LimitationsNotice />

              <div className="grid gap-4 md:grid-cols-2">
                <Gauge score={result.overallScore} label={result.summary} />
                <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
                  <h2 className="mb-3 text-lg font-semibold">Signal breakdown</h2>
                  <SignalBars contributions={result.contributions} />
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">Confidence band: {result.confidenceBand}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Flagged text clues</h2>
                <HighlightedText text={text} flagged={result.flaggedSentences} />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
                  onClick={async () => {
                    const report = [
                      `Heuristic score: ${Math.round(result.overallScore)} (${result.summary})`,
                      `Confidence: ${result.confidenceBand}`,
                      ...result.contributions.map((item) => `${item.label}: ${Math.round(item.score)} - ${item.evidence}`)
                    ].join('\n');
                    await navigator.clipboard.writeText(report);
                  }}
                >
                  Copy report
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
                  onClick={() => {
                    const report = [
                      `Heuristic score: ${Math.round(result.overallScore)} (${result.summary})`,
                      `Confidence: ${result.confidenceBand}`,
                      ...result.contributions.map((item) => `${item.label}: ${Math.round(item.score)} - ${item.evidence}`)
                    ].join('\n');
                    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'memo-detector-report.txt';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download report (.txt)
                </button>
              </div>

              {apiKey.trim() ? (
                <section className="space-y-2 rounded-xl border border-slate-300 p-4 dark:border-slate-700">
                  <h2 className="text-lg font-semibold">Optional LLM second opinion</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Separate from heuristic score. This sends text directly to your selected provider with your key.
                  </p>
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
                    onClick={runLlmOpinion}
                    disabled={llmLoading}
                  >
                    {llmLoading ? 'Requesting opinion…' : 'Run LLM second opinion'}
                  </button>
                  {llmError ? <p className="text-sm text-rose-600">{llmError}</p> : null}
                  {llmResult ? (
                    <div className="space-y-2 text-sm">
                      <p>
                        LLM AI-likelihood: <strong>{Math.round(llmResult.score)}</strong>
                      </p>
                      <p>
                        <strong>Evidence:</strong>
                      </p>
                      <ul className="list-disc pl-5">
                        {llmResult.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p>
                        <strong>Uncertainty:</strong> {llmResult.uncertainty}
                      </p>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
              <h2 className="mb-2 text-lg font-semibold">How it works</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                The detector combines multiple language signals: burstiness, lexical diversity, repetition,
                transition patterns, phrase cues, contraction/irregularity rates, and readability consistency.
              </p>
            </article>
            <article className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
              <h2 className="mb-2 text-lg font-semibold">Limitations</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                This tool provides style-based risk signals only. It cannot prove authorship and should never be
                used as the sole basis for disciplinary or employment decisions.
              </p>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
