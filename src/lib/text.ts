export const MAX_INPUT_CHARS = 50_000;

export function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tokenizeWords(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}\p{N}']+/gu);
  return matches ?? [];
}

export function clampScore(score: number): number {
  if (Number.isNaN(score)) {
    return 50;
  }

  return Math.max(0, Math.min(100, score));
}
