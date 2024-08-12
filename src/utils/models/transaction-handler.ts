import {TransactionReceipt} from "web3-types";
import {type Web3PromiEvent} from "web3-core";


type ResolveReject = (_value?: any | unknown) => void;

export function transactionHandler(transaction: Web3PromiEvent<TransactionReceipt, Record<string, unknown>>,
                                   resolve: ResolveReject,
                                   reject: ResolveReject,
                                   debug = false,
                                   confirmations = 1) {

  const logDebug =
    (event: string, dbg: any) =>
        debug ? console.log(`EVENT: ${event}`, dbg) : null;

  if (confirmations === 1)
    transaction
      .on(`receipt`, (receipt) => {
        logDebug("onReceipt (immediate)", receipt);

        if (confirmations === 1)
          resolve(receipt);
      });
  else
    transaction
    .on(`confirmation`, ({receipt, confirmations: confirmationNumber}: any) => {
      logDebug("onConfirmation", {receipt, confirmationNumber, confirmations});

      if (confirmationNumber >= confirmations)
        resolve(receipt as unknown as TransactionReceipt);
    });

  transaction
    .on(`sending`, (r) => {
      logDebug("onSending", r);
    })
    .on(`sent`, (r) => {
      logDebug("onSent", r);
    })
    .on(`error`, (err) => {
      logDebug("onError", err as Error);

      reject(err)
    })
    .catch(err => {
      logDebug("Thrown", err as Error);

      reject(err)
    });
}
