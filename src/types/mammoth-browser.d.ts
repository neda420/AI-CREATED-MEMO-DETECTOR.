declare module 'mammoth/mammoth.browser' {
  interface ExtractResult {
    value: string;
  }

  interface MammothBrowser {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
  }

  const mammoth: MammothBrowser;
  export default mammoth;
}
