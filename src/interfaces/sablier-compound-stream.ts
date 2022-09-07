export interface SablierCompoundingStream {
  sender: string;
  recipient: string;
  tokenAddress: string;
  deposit: string | number;
  startTime: number;
  stopTime: number;
  remainingBalance: string | number;
  ratePerSecond: string | number;
  exchangeRateInitial: string | number;
  senderSharePercentage: string | number;
  recipientSharePercentage: string | number;
}
