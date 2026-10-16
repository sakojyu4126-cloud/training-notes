declare module "mammoth" {
  export interface RawTextResult {
    value: string;
    messages: any[];
  }
  export function extractRawText(options: { buffer?: Buffer; arrayBuffer?: ArrayBuffer }): Promise<RawTextResult>;
}
