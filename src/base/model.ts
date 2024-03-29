import {Web3Connection} from './web3-connection';
import {AbiItem} from 'web3-utils';
import {Errors} from '@interfaces/error-enum';
import Web3 from 'web3';
import {Account} from 'web3-core';
import {TransactionReceipt} from '@interfaces/web3-core';
import {Web3Contract} from './web3-contract';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {ContractSendMethod, DeployOptions} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';
import {transactionHandler} from '@utils/transaction-handler';
import {noop} from '@utils/noop';

export class Model<Methods = any> {
  protected _contract!: Web3Contract<Methods>;
  protected _contractAddress?: string;
  private readonly web3Connection!: Web3Connection;

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
              readonly abi: AbiItem[],
              contractAddress?: string) {
    if (!abi || !abi.length)
      throw new Error(Errors.MissingAbiInterfaceFromArguments);

    if (contractAddress)
      this._contractAddress = contractAddress;

    if (web3Connection instanceof Web3Connection)
      this.web3Connection = web3Connection;
    else this.web3Connection = new Web3Connection(web3Connection);

    if (this.web3Connection.started)
      this.loadAbi(); // cannot call start because start is async, has to be called by user-land
  }
  /* eslint-enable complexity */

  /**
   * Pointer to the {@link Web3Connection} assigned to this contract class
   * @protected
   */
  get connection(): Web3Connection { return this.web3Connection; }

  /**
   * Returns the Web3 class assigned to this connection
   */
  get web3(): Web3 { return this.connection.Web3; }

  /**
   * Returns the Account associated with this connection
   */
  get account(): Account { return this.connection.Account; }

  /**
   * Initialize the underlying web3js contract
   */
  loadAbi() {
    this._contract = new Web3Contract(this.web3, this.abi, this._contractAddress);
  }

  /**
   * Deprecated - async capabilities on this function will affect autoStart: true option, use `start()` instead
   * if you need async abilities.
   *
   * ~~Preferred~~ Alternative way of initializing and loading a contract, ~~use this function to customize contract loading,
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
    await this.web3Connection.start();
    this.loadAbi();
  }

  /**
   * Return a property value from the contract
   */
  async callTx<ReturnData = any>(method: ContractCallMethod<ReturnData>) {
    return method.call();
  }

  /**
   * Interact with, or change a value of, a property on the contract
   */
  async sendTx(method: ContractSendMethod,
               value?: any): Promise<TransactionReceipt> {
    if (this.account)
      return this.contract.sendSignedTx(this.account,
                                        method.encodeABI(),
                                        value,
                                        await this.contract.txOptions(method,
                                                                      value,
                                                                      await this.connection.getAddress()),
                                        this.connection.options);

    else return this.sendUnsignedTx(method, value, this.connection.options);
  }

  /* eslint-disable no-async-promise-executor */
  /**
   * Send unsigned transaction
   */
  async sendUnsignedTx(method: ContractSendMethod,
                       value?: any, {
                         debug,
                         customTransactionHandler: cb
                       }: Partial<Web3ConnectionOptions> = {}): Promise<TransactionReceipt> {
    const from = (await this.web3.eth.givenProvider.request({method: 'eth_requestAccounts'}))?.[0];

    return new Promise<TransactionReceipt>(async (resolve, reject) => {
      try {
        const options = await this.contract.txOptions(method, value, from);
        const sendMethod = () => method.send({from, value, ...options}, noop);

        if (cb)
          cb(sendMethod(), resolve, reject, debug)
        else
          transactionHandler(sendMethod(), resolve, reject, debug)
      } catch (e) {
        if (debug)
          console.error(e);
        reject(e);
      }
    }).then(receipt => this.contract.parseReceiptLogs(receipt));
  }
  /* eslint-enable no-async-promise-executor */

  /**
   * Deploy the loaded abi contract
   */
  async deploy(deployOptions: DeployOptions, account?: Account) {
    return this.contract.deploy(this.abi, deployOptions, account)
      .then(async tx => {
        if (this.web3Connection.options.restartModelOnDeploy && tx.contractAddress) {
          this._contractAddress = tx.contractAddress;
          await this.start();
        }
        return tx;
      })
  }
}
