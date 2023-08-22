import {TransactionReceipt} from "web3-types";
import {type Web3PromiEvent} from "web3-core";


type ResolveReject = (value?: any | unknown) => void;

export function transactionHandler(transaction: Web3PromiEvent<TransactionReceipt, Record<string, unknown>>,
                                   resolve: ResolveReject,
                                   reject: ResolveReject,
                                   debug?: boolean) {
  transaction
    .on(`receipt`, (receipt) => {
      if (debug)
        console.log(receipt);

      resolve(receipt as unknown as TransactionReceipt)
    })
    .on(`error`, (err) => {
      if (debug)
        console.error(err);

      reject(err)
    })
    .catch(err => {
      if (debug)
        console.error(err);

      reject(err)
    });
}
