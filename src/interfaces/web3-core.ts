export interface Log<T = any> {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;

  removed: boolean;

  address: string;
  data: string;

  topics: Array<string>;

  transactionHash: string;
  logIndex: number;

  event?: string;
  args?: T;
}

export interface TransactionReceipt<T = any> {
  to: string;
  from: string;
  contractAddress: string,
  transactionIndex: number,
  root?: string,
  gasUsed: number,
  logsBloom: string,
  blockHash: string,
  transactionHash: string,
  logs: Array<Log<T>>,
  blockNumber: number,
  confirmations: number,
  cumulativeGasUsed: number,
  effectiveGasPrice: number,
  byzantium: boolean,
  type: number;
  status?: number
}
