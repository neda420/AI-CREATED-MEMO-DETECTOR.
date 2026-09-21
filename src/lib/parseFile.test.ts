import { parseFile } from './parseFile';

function makeFile(name: string, content: string, type = 'text/plain'): File {
  return new File([content], name, { type });
}

describe('parseFile', () => {
  it('parses txt files', async () => {
    const file = makeFile('memo.txt', '  hello\n\nworld  ');
    await expect(parseFile(file)).resolves.toBe('hello world');
  });

  it('rejects empty files', async () => {
    const file = makeFile('empty.txt', '');
    await expect(parseFile(file)).rejects.toThrow('empty');
  });

  it('rejects unsupported extensions', async () => {
    const file = makeFile('memo.csv', 'x,y,z');
    await expect(parseFile(file)).rejects.toThrow('Unsupported file type');
  });
});
