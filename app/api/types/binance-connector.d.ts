declare module "@binance/connector" {
    export class Spot {
      constructor(apiKey: string, apiSecret: string, options?: any);
      account(): Promise<{ data: any }>;
    }
  }
  