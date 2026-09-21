import type { ChangeEvent } from 'react';
import { parseFile } from '../lib/parseFile';

interface FileDropProps {
  onTextLoaded: (text: string) => void;
  onError: (message: string) => void;
}

export function FileDrop({ onTextLoaded, onError }: FileDropProps) {
  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await parseFile(file);
      onTextLoaded(text);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'File parse failed.');
    }
  };

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">Upload file (.txt, .md, .docx, .pdf)</span>
      <input
        aria-label="Upload text file"
        className="block w-full rounded border border-slate-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        type="file"
        accept=".txt,.md,.docx,.pdf"
        onChange={onFileChange}
      />
    </label>
  );
}
