import {ContractAbi} from 'web3';
import {Web3BaseWalletAccount} from "web3/lib/types";
import {NonPayableMethodObject, PayableMethodObject} from "web3-eth-contract/src/types";

import {Errors} from '@interfaces/error-enum';
import {TransactionReceipt} from '@interfaces/web3-core';
import {Web3Contract, Web3ContractOptions} from './web3-contract';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import DeployOptions from "@interfaces/contract/deploy-options";

import {Web3Connection} from './web3-connection';

export class Model<Abi extends ContractAbi> {
  protected _contract!: Web3Contract<Abi>;
  protected _contractAddress?: string;
  private readonly web3Connection!: Web3Connection;
  readonly contractOptions: Web3ContractOptions = {auto: true, confirmations: 1}

  /**
   * Returns the {@link Web3Contract} class representing this contract
   */
  get contract() { return this._contract; }

  /**
   * Returns the {@link _contractAddress} string representing this models contract address (if any)
   */
  get contractAddress() { return this._contractAddress; }


  /* eslint-disable complexity */
  constructor(web3Connection: Web3Connection | Web3ConnectionOptions,
              readonly abi: Abi,
              contractAddress?: string,
              contractOptions?: Web3ContractOptions) {
    if (!abi || !abi.length)
      throw new Error(Errors.MissingAbiInterfaceFromArguments);

    if (contractAddress)
      this._contractAddress = contractAddress;

    if (web3Connection instanceof Web3Connection)
      this.web3Connection = web3Connection;
    else this.web3Connection = new Web3Connection(web3Connection);


    this.contractOptions = {
      confirmations: this.web3Connection.options.confirmations || 1,
      auto: true,
      debug: this.web3Connection.options.debug,
      ...contractOptions,
    } as never;

    if (this.web3Connection.started)
      this.loadAbi(); // no need to call .start() be cause .start calls web3connection.start first
  }
  /* eslint-enable complexity */

  /**
   * Pointer to the {@link Web3Connection} assigned to this contract class
   * @protected
   */
  get connection(): Web3Connection { return this.web3Connection; }


  /**
   * Initialize the underlying web3js contract
   */
  loadAbi() {
    this._contract = new Web3Contract(this.connection.Web3, this.abi, this._contractAddress, this.contractOptions);
  }

  /**
   * Alternative way of initializing and loading a contract, ~~use this function to customize contract loading,
   * initializing any other dependencies the contract might have when extending from Model~~
   * @throws Errors.MissingContractAddress
   * @deprecated
   */
  loadContract() {
    if (!this.contractAddress)
      throw new Error(Errors.MissingContractAddress)

    this.loadAbi();
  }

  /**
   * Alias for Web3Connection.connect();
   * Will load contract if success
   */
  async connect(): Promise<boolean> {
    const connected = await this.web3Connection.connect();

    if (connected)
      await this.start();

    return connected;
  }

  /**
   * Alias for Web3Connection.start();
   * Will load contract (via {@link loadAbi}) if success; use this function to customize contract loading, initializing any other
   * dependencies the contract might have when extending from Model.
   * @void
   */
  async start() {
    this.web3Connection.start();
    this.loadAbi();
  }

  /**
   * Return a property value from the contract
   * @see <method.call()>
   */
  // eslint-disable-next-line class-methods-use-this
  async callTx<ForceOutput>(method: PayableMethodObject|NonPayableMethodObject) {
    return method.call<ForceOutput>();
  }

  /**
   * Interact with, or change a value of, a property on the contract
   */
  async sendTx<Outputs = unknown>(method: PayableMethodObject|NonPayableMethodObject,
               value?: never): Promise<TransactionReceipt<Outputs>> {
    if (this.connection.Account)
      return this.contract.sendSignedTx(this.connection.Account,
                                        method.encodeABI(),
                                        value,
                                        await this.contract.txOptions(method,
                                                                      value,
                                                                      await this.connection.getAddress()),
                                        this.connection.options);

    else return this.contract.sendUnsignedTx(method, value, this.connection.options);
  }

  /**
   * Deploy the loaded abi contract
   */
  async deploy(deployOptions: DeployOptions<Abi>, account?: Web3BaseWalletAccount) {
    if (!this.contract)
      this.loadAbi();

    return this.contract.deploy(deployOptions, account)
      .then(async tx => {
        if (this.web3Connection.options.restartModelOnDeploy && tx.contractAddress) {
          this._contractAddress = tx.contractAddress;
          await this.start();
        }
        return tx;
      })
  }
}
