/// <reference lib="webworker" />
import { runDetection } from './detector';
import { MAX_INPUT_CHARS } from './text';

interface AnalyzeMessage {
  text: string;
}

self.onmessage = (event: MessageEvent<AnalyzeMessage>) => {
  try {
    const { text } = event.data;
    if (!text.trim()) {
      throw new Error('Please provide some text to analyze.');
    }

    if (text.length > MAX_INPUT_CHARS) {
      throw new Error(`Input is too large. Please keep text under ${MAX_INPUT_CHARS.toLocaleString()} characters.`);
    }

    const result = runDetection(text);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown analysis error.'
    });
  }
};

export {};
