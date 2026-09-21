import { MAX_INPUT_CHARS } from './text';

export type LlmProvider = 'openai' | 'anthropic';

export interface LlmOpinion {
  score: number;
  evidence: string[];
  uncertainty: string;
  raw: string;
}

export interface LlmRequest {
  key: string;
  provider: LlmProvider;
  text: string;
  timeoutMs?: number;
}

const PROVIDER_MODELS: Record<LlmProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest'
};

function buildPrompt(text: string): string {
  return [
    'You are a writing-analysis assistant. Provide a cautious probabilistic estimate only.',
    'Return JSON with keys: score (0-100), evidence (array of 2-3 direct quotes), uncertainty (string).',
    'Include an explicit statement that this is uncertain and not proof.',
    'Text to analyze:',
    text
  ].join('\n\n');
}

function clipText(text: string): string {
  return text.length > MAX_INPUT_CHARS ? text.slice(0, MAX_INPUT_CHARS) : text;
}

function parseJsonFromText(raw: string): LlmOpinion {
  const blockMatch = raw.match(/\{[\s\S]*\}/);
  if (!blockMatch) {
    throw new Error('The LLM response was not valid JSON.');
  }

  const parsed = JSON.parse(blockMatch[0]) as {
    score?: number;
    evidence?: string[];
    uncertainty?: string;
  };

  return {
    score: Math.max(0, Math.min(100, Number(parsed.score ?? 50))),
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 3) : [],
    uncertainty: parsed.uncertainty ?? 'Uncertainty statement missing from model output.',
    raw
  };
}

export async function requestLlmOpinion({ key, provider, text, timeoutMs = 20_000 }: LlmRequest): Promise<LlmOpinion> {
  if (!key.trim()) {
    throw new Error('Set an API key before requesting an LLM opinion.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const prompt = buildPrompt(clipText(text));

  try {
    const response =
      provider === 'openai'
        ? await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + key
            },
            body: JSON.stringify({
              model: PROVIDER_MODELS.openai,
              temperature: 0.2,
              messages: [{ role: 'user', content: prompt }]
            }),
            signal: controller.signal
          })
        : await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': key,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
              model: PROVIDER_MODELS.anthropic,
              max_tokens: 450,
              messages: [{ role: 'user', content: prompt }]
            }),
            signal: controller.signal
          });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Provider request failed (${response.status}). ${body.slice(0, 180)}`);
    }

    const json = (await response.json()) as unknown;
    let raw = '';

    if (provider === 'openai') {
      const openAiJson = json as { choices?: Array<{ message?: { content?: string } }> };
      raw = openAiJson.choices?.[0]?.message?.content ?? '';
    } else {
      const anthropicJson = json as { content?: Array<{ type?: string; text?: string }> };
      raw = anthropicJson.content?.find((chunk: { type?: string }) => chunk.type === 'text')?.text ?? '';
    }

    if (!raw) {
      throw new Error('Provider returned an empty response.');
    }

    return parseJsonFromText(raw);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('LLM request timed out. Please try again or use a shorter text.');
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Browser request failed, likely due to CORS/network restrictions from the provider. Try another provider or run heuristics only.'
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
