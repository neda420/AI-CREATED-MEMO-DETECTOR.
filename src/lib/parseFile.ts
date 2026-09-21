import mammoth from 'mammoth/mammoth.browser';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import { MAX_INPUT_CHARS, normalizeWhitespace } from './text';

if (typeof Worker !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
}

const SUPPORTED_EXTENSIONS = ['txt', 'md', 'docx', 'pdf'] as const;

function extensionFor(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts[parts.length - 1] ?? '';
}

function readWithFileReader(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      resolve(value);
    };
    reader.readAsText(file);
  });
}

async function parseDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function parsePdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const document = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => ('str' in item ? String(item.str) : '')).join(' '));
  }

  return pageTexts.join('\n');
}

export async function parseFile(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('The selected file is empty.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File is too large. Please upload a file up to 10 MB.');
  }

  const extension = extensionFor(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
    throw new Error('Unsupported file type. Use .txt, .md, .docx, or .pdf.');
  }

  try {
    const text =
      extension === 'docx'
        ? await parseDocx(file)
        : extension === 'pdf'
          ? await parsePdf(file)
          : await readWithFileReader(file);

    const cleaned = normalizeWhitespace(text);
    if (!cleaned) {
      throw new Error('The file did not contain readable text.');
    }

    if (cleaned.length > MAX_INPUT_CHARS) {
      throw new Error(`Parsed text is too large. Please keep input under ${MAX_INPUT_CHARS.toLocaleString()} characters.`);
    }

    return cleaned;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to parse file content.');
  }
}
