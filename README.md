# AI-Created Memo Detector

A production-ready, browser-only web app that estimates whether writing **reads more human-like or AI-like** using transparent linguistic signals.

Live URL: **https://neda420.github.io/AI-CREATED-MEMO-DETECTOR/**

## Important reliability caveat

This detector provides a probabilistic writing-style signal, **not proof of authorship**. AI detection is unreliable; false positives and false negatives are common. Never use this as the sole basis for accusations, discipline, or consequential decisions.

## Privacy-first design

- No backend, no database, no API routes, no serverless functions.
- Text is analyzed entirely in the browser (including file parsing and heuristic scoring).
- No analytics that capture content.
- Optional LLM second opinion sends text only if the user explicitly triggers it with their own key.

## Features

- Heuristic score (0–100) with honest labels:
  - Reads more like human writing
  - Mixed / inconclusive
  - Reads more like AI writing
- Per-signal breakdown and flagged sentence highlights.
- Supported file import: `.txt`, `.md`, `.docx` (mammoth), `.pdf` (pdfjs-dist).
- Optional BYOK LLM second opinion (OpenAI / Anthropic) with timeout and failure handling.
- Copy/download text report.
- Light/dark mode, responsive UI, accessibility-friendly controls.
- Input cap and XSS-safe rendering (no `dangerouslySetInnerHTML`).

## How it works

Signals are computed in a Web Worker to keep the UI responsive:

- Burstiness (sentence-length variation)
- Lexical diversity (TTR + moving-average TTR)
- Repetition (repeated n-grams and sentence openers)
- AI tell phrase density (editable list)
- Contraction and irregularity rates
- Transition-word density + sentence-length uniformity
- Readability consistency across paragraphs

Each signal contributes to an overall weighted score.

## Optional LLM second opinion (BYOK)

- Users provide their own API key in-browser (saved in localStorage only).
- A **clear key** button removes stored keys.
- If the provider blocks browser calls (CORS/policy), the app shows a clear error.
- Key safety warning: any key entered in client-side apps lives in the browser context. Use limited/scoped keys and clear keys on shared machines.

## Local development

```bash
npm ci
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## GitHub Pages and CI deployment

This repository uses a single workflow at `.github/workflows/deploy.yml` that runs:

1. install
2. typecheck
3. lint
4. tests
5. build
6. deploy `dist/` to GitHub Pages

The Vite base path is configured for this project page:

```ts
base: '/AI-CREATED-MEMO-DETECTOR/'
```

### Required repository setting

In GitHub repository settings, set:

- **Settings → Pages → Build and deployment → Source = GitHub Actions**

Without this setting, deployment will not publish from the workflow.

## Security note about CSP on Pages

A CSP is included via `<meta http-equiv="Content-Security-Policy">` in `index.html`. GitHub Pages cannot set custom HTTP security headers, so meta CSP is best-effort mitigation only.

## License

MIT (see `LICENSE`)
