import {HttpProviderOptions, WebsocketProviderOptions} from 'web3-core-helpers';
import {PromiEvent, provider as Provider, TransactionReceipt} from 'web3-core';
import {Contract} from "web3-eth-contract";

export interface Web3ConnectionOptions {

  /**
   * Web3 Provider host
   */
  web3Host?: string;

  /**
   * Provide a privateKey to automatically use that account when started
   */
  privateKey?: string;

  /**
   * Pass options to provider
   * @note you can provide a node server if you're using IPC
   */
  web3ProviderOptions?: HttpProviderOptions | WebsocketProviderOptions;
  
  /**
   * Pass a custom provider instead
   */
  web3CustomProvider?: Provider;

  /**
   * Skip the assignment of `window.web3 = Web3`
   * @default false
   */
  skipWindowAssignment?: boolean;

  /**
   * output sendTx debug messages to console (via console.log)
   * @default false
   */
  debug?: boolean;

  customTransactionHandler?: (event: PromiEvent<TransactionReceipt | Contract>,
                              resolve: (data: any) => void,
                              reject: (e: unknown) => void,
                              debug?: boolean) => void;

  /**
   * If true, web3Connection will call `.start()` on construction
   * @default true
   */
  autoStart?: boolean;

  /**
   * If true, model will call .loadContract() after being deployed with the returned contractAddress
   * from the transaction receipt
   * @default true
   */
  restartModelOnDeploy?: boolean;
}
