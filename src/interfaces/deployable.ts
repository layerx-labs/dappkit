import {TransactionReceipt} from '@interfaces/web3-core';

export interface Deployable {
  deployJsonAbi(...args: never[]): Promise<TransactionReceipt>;
}
