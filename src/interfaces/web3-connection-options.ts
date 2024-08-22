import {type Socket} from "net";
import {type Web3PromiEvent} from "web3-core/lib/types/web3_promi_event";
import {type Web3EventMap} from "web3-core/src/web3_event_emitter";
import {type SupportedProviders} from "web3-types/src/web3_base_provider";



export interface Web3ConnectionOptions {

  /**
   * Web3 Provider host
   */
  web3Host?: string;

  /**
   * Provide a privateKey to automatically use that account when started
   * If not provided, only read-mode will be possible
   */
  privateKey?: string|Uint8Array;

  /**
   * Pass options a socket to the custom provider if needed
   */
  net?: Socket,

  /**
   * Pass a custom provider instead
   */
  web3CustomProvider?: SupportedProviders;

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


  /* eslint-disable @typescript-eslint/no-unused-vars */
  // eslint-disable-next-line max-len
  customTransactionHandler?: <ResolveType = unknown, EventMap extends Web3EventMap = never>(event: Web3PromiEvent<ResolveType, EventMap>,
                                                                                resolve: (data: never) => void,
                                                                                reject: (e: unknown) => void,
                                                                                debug?: boolean) => void;
  /* eslint-enable @typescript-eslint/no-unused-vars */
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

  /**
   * Minimum confirmations needed to return a receipt
   * @default 1
   */
  confirmations?: number;
}
