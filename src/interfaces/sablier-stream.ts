export interface SablierStream {
  sender: string;
  recipient: string;
  deposit: string | number;
  tokenAddress: string;
  startTime: number;
  stopTime: number;
  remainingBalance: string | number;
  ratePerSecond: string | number;
}
