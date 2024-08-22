import {sha3} from 'web3-utils';
import {Contract,} from 'web3-eth-contract';
import Web3, {ContractAbi, FMT_BYTES, FMT_NUMBER, Web3BaseWalletAccount} from 'web3';
import {Log, TransactionReceipt} from '@interfaces/web3-core';
import {Errors} from '@interfaces/error-enum';
import {transactionHandler} from '@utils/models/transaction-handler';
import {Web3ConnectionOptions} from "@interfaces/web3-connection-options";
import {AbiEventFragment, AbiFragment} from "web3-types/src/eth_abi_types";
import DeployOptions from "@interfaces/contract/deploy-options";
import {NonPayableMethodObject, PayableMethodObject} from "web3-eth-contract/src/types";
import {Transaction} from "web3-types/src/eth_types";

export interface Web3ContractOptions {
  /**
   * If not provided, gas will be `Math.round(gasAmount * gasFactor)`
   */
  gas?: number;

  /**
   * If not provided, gasPrice will be queried on the network
   */
  gasPrice?: number;

  /**
   * If not provided, gasAmount will be estimated from the network
   */
  gasAmount?: number;

  /**
   * Used as a multiplier if no {@link Web3ContractOptions.gas} is provided
   * @default 1
   */
  gasFactor?: number;

  /**
   * If false, {@link Web3ContractOptions.gas} and {@link Web3ContractOptions.gasPrice} are mandatory
   * @default true
   */
  auto: boolean; // default: true, auto = true will calculate needed values if none is provided.

  /**
   * Minimum confirmations needed to return a successful receipt
   * @default 1
   */
  confirmations?: number;
}

export class Web3Contract<Abi extends ContractAbi = AbiFragment[]> {
  readonly self!: Contract<Abi>;
  readonly abi: Abi;

  /**
   * Transaction options that will be used on each transaction.
   * While this object is readonly, is values are not and can be changed.
   * @example
   * `myWeb3Connection.options.gas = 10000;`
   *
   * @default {auto: true, confirmations: 1}
   */
  readonly options: Web3ContractOptions = {auto: true, confirmations: 1}

  constructor(readonly web3: Web3,
              abi: Abi,
              readonly address?: string,
              options: Web3ContractOptions = {auto: true, confirmations: 1}) {
    if (!abi)
      throw new Error(Errors.MissingAbiInterfaceFromArguments)

    this.self = new web3.eth.Contract(abi, address, {
      config: {contractDataInputFill: "both", transactionConfirmationBlocks: options.confirmations}
    });
    this.options = options;
    this.abi = abi;
  }

  get methods() { return this.self.methods; }
  get events() { return this.self.events; }

  /* eslint-disable complexity */
  async txOptions(method: Pick<PayableMethodObject|NonPayableMethodObject, 'estimateGas'>,
                  value?: string,
                  from?: string) {
    let {gas = 0, gasAmount = 0, gasPrice = 0,} = this.options || {};
    const {gasFactor = 0, auto = true} = this.options || {};

    if (!auto && (!gas || !gasPrice))
      throw new Error(Errors.GasAndGasPriceMustBeProvidedIfNoAutoTxOptions);

    if (auto) {
      if (!gasPrice)
        gasPrice = Number(await this.web3.eth.getGasPrice({number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX}));

      if (!gasAmount)
        gasAmount = Number(await method.estimateGas({...value ? {value} : {}, ...from ? {from} : {}}));

      if (!gas)
        gas = Math.round(Number(gasAmount) * gasFactor);
    }

    return {
      ... gas ? {gas: gas.toString()} : {},
      ... gasPrice ? {gasPrice: gasPrice.toString()} : {},
    };
  }
  /* eslint-enable complexity */

  /* eslint-disable complexity */
  /**
   * Parses the logs of a transaction receipt using its abi events
   */
  parseReceiptLogs<T = unknown>(receipt: TransactionReceipt): TransactionReceipt<T> {
    if (receipt.logs?.length) {
      const _events =
        (this.abi.filter(({type}) => type === "event") as AbiEventFragment[])
          .map(({inputs, ...rest}) =>
            ({inputs, ...rest, topic: sha3(`${rest.name}(${inputs?.map(i=> i.type).join(',')})`)}));

      const hasAddressAndEqualLog = ({address}: Log) =>
        !this.address ? true : this.address.toLowerCase() === address.toLowerCase()

      for (const [i, log] of receipt.logs.entries()) {
        for (const _event of _events) {
          if (_event.topic === log.topics[0] && hasAddressAndEqualLog(log)) {
            const args =
              this.web3.eth.abi
                .decodeLog([..._event.inputs ?? []], log.data, _event.anonymous ? log.topics : log.topics.slice(1))
            receipt.logs[i] = {...log, event: _event?.name, args} as unknown as Log & {event: string, args: T};
          }
        }
      }
    }

    return receipt as TransactionReceipt<T>;
  }
  /* eslint-enable complexity */

  /**
   * Deploys the new AbiItem and returns its transaction receipt
   */
  async deploy(deployOptions: DeployOptions<Abi>,
               account?: Web3BaseWalletAccount): Promise<TransactionReceipt> {

    // eslint-disable-next-line no-unused-vars
    const deployer = async (resolve: (tx: TransactionReceipt) => void, reject: (error: Error) => void) => {
      try {
        const limbo = this.self.deploy(deployOptions);
        const from = 
          account?.address || (await (this.web3.eth as any).personal.getAccounts())[0];

        if (account) {
          // eslint-disable-next-line max-len
          this.sendSignedTx(account, limbo.encodeABI(), undefined, await this.txOptions(limbo, "0x0", from), this.options)
            .then(resolve)
            .catch(reject);
        } else
          this.sendUnsignedTx(limbo as any, undefined).then(resolve).catch(reject)
      } catch (e: any) {
        reject(e as Error);
      }
    }

    return new Promise<TransactionReceipt>(deployer)
      .then(receipt => this.parseReceiptLogs(receipt));
  }

  /**
   * Sends a signed transaction with the provided account
   */
  async sendSignedTx(account: Web3BaseWalletAccount,
               data: string,
               value = "0x0",
               txOptions: Partial<Transaction>, {
                 debug,
                 customTransactionHandler: cb,
                 confirmations,
               }: Partial<Web3ConnectionOptions> = {}): Promise<TransactionReceipt> {
    /* eslint-disable no-async-promise-executor */
    return new Promise<TransactionReceipt>(async (resolve, reject) => {
      try {

        const from = account.address;
        const to = this.address;
        const signedTx = await account.signTransaction({from, to, data, value, ...txOptions});
        const sendMethod = () =>
          this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        if (cb)
          cb(sendMethod() as any, resolve, reject, debug);
        else
          transactionHandler(sendMethod(), resolve, reject, debug, confirmations);

      } catch (e) {
        console.error(`signedTxError`, e);
        reject(e);
      }
    }).then((receipt) => this.parseReceiptLogs(receipt))
    /* eslint-enable no-async-promise-executor */
  }

  /* eslint-disable no-async-promise-executor */
  /**
   * Send unsigned transaction
   */
  async sendUnsignedTx(method: PayableMethodObject|NonPayableMethodObject,
    value?: any, {
      debug,
      customTransactionHandler: cb, confirmations = 1,
    }: Partial<Web3ConnectionOptions> = {}): Promise<TransactionReceipt> {
    const from = (await this.web3.eth.personal.getAccounts())?.[0];

    return new Promise<TransactionReceipt>(async (resolve, reject) => {
      try {
        const options = await this.txOptions(method, value, from);
        const sendMethod = () => method.send({from, value, ...options});

        if (cb)
          cb(sendMethod() as any, resolve, reject, debug)
        else
          transactionHandler(sendMethod(), resolve, reject, debug, confirmations)
      } catch (e) {
        if (debug)
          console.error(e);
        reject(e);
      }
    }).then(receipt => this.parseReceiptLogs(receipt));
  }
  /* eslint-enable no-async-promise-executor */
}
