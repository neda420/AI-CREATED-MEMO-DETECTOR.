import { requestLlmOpinion } from './llm';

describe('requestLlmOpinion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles timeout path', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }) as Promise<Response>;
    });

    await expect(
      requestLlmOpinion({ key: 'k', provider: 'openai', text: 'sample', timeoutMs: 10 })
    ).rejects.toThrow('timed out');
  });

  it('handles provider errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('bad request', { status: 400, statusText: 'Bad Request' })
    );

    await expect(requestLlmOpinion({ key: 'k', provider: 'openai', text: 'sample' })).rejects.toThrow(
      'Provider request failed'
    );
  });
});
