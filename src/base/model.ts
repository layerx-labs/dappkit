import {Web3Connection} from './web3-connection';
import {AbiItem} from 'web3-utils';
import {Errors} from '@interfaces/error-enum';
import Web3 from 'web3';
import {Account, HttpProvider, WebsocketProvider,} from 'web3-core';
import {TransactionReceipt} from '@interfaces/web3-core';
import {Web3Contract} from './web3-contract';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {ContractSendMethod, DeployOptions} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';
import {transactionHandler} from '@utils/transaction-handler';
import {noop} from '@utils/noop';
import {EIP4361Message} from "@interfaces/eip4361-message";
import {TypedDataV4} from "@interfaces/typed-data-v4";
import {EIP4361, EIP712Domain} from "@utils/constants";


export class Model<Methods = any> {
  protected _contract!: Web3Contract<Methods>;
  private readonly web3Connection!: Web3Connection;

  /**
   * Returns the {@link Web3Contract} class representing this contract
   */
  get contract() { return this._contract; }

  constructor(web3Connection: Web3Connection | Web3ConnectionOptions,
              readonly abi: AbiItem[],
              readonly contractAddress?: string) {
    if (!abi || !abi.length)
      throw new Error(Errors.MissingAbiInterfaceFromArguments);

    if (web3Connection instanceof Web3Connection)
      this.web3Connection = web3Connection;
    else this.web3Connection = new Web3Connection(web3Connection);
  }

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
   * Permissive way of initializing the contract, used primarily for deploys. Prefer to use {@link loadContract}
   */
  loadAbi() {
    this._contract = new Web3Contract(this.web3, this.abi, this.contractAddress);
  }

  /**
   * Preferred way of initializing and loading a contract
   * @throws Errors.MissingContractAddress
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
      this.loadContract();

    return connected;
  }

  /**
   * Alias for Web3Connection.start();
   * Will load contract if success
   */
  async start() {
    await this.web3Connection.start();
    this.loadContract();
  }

  /**
   * Return a property value from the contract
   */
  async callTx<ReturnData = any>(method: ContractCallMethod<ReturnData>, value?: any) {
    const from = await this.connection.getAddress() || undefined;
    return method.call({ ... from ? {from} : {}, ...await this.contract.txOptions(method, value, from)});
  }

  /**
   * Interact with, or change a value of, a property on the contract
   */
  async sendTx(method: ContractSendMethod,
               value?: any,
               debug = this.web3Connection?.options?.debug): Promise<TransactionReceipt> {
    if (this.account)
      return this.contract.sendSignedTx(this.account,
                                        method.encodeABI(),
                                        value,
                                        await this.contract.txOptions(method,
                                                                      value,
                                                                      await this.connection.getAddress()),
                                        debug);

    else return this.sendUnsignedTx(method, value, debug);
  }

  /* eslint-disable no-async-promise-executor */
  /**
   * Send unsigned transaction
   */
  async sendUnsignedTx(method: ContractSendMethod, value?: any, debug?: boolean): Promise<TransactionReceipt> {
    const from = (await this.web3.eth.getAccounts())[0];

    return new Promise(async (resolve, reject) => {
      try {
        const options = await this.contract.txOptions(method, value, from);
        await transactionHandler(method.send({from, value, ...options}, noop), resolve, reject, debug)
      } catch (e) {
        if (debug)
          console.error(e);
        reject(e);
      }
    });
  }
  /* eslint-enable no-async-promise-executor */

  /**
   * Deploy the loaded abi contract
   * @protected
   */
  protected async deploy(deployOptions: DeployOptions, account?: Account) {
    return this.contract.deploy(this.abi, deployOptions, account)
  }

  /**
   * Uses eth_signTypedData_v4
   * @link https://docs.metamask.io/guide/signing-data.html#sign-typed-data-v4
   * @protected
   */
  protected async sendTypedData(message: TypedDataV4, from: string) {
    return new Promise((resolve, reject) => {
      try {
        (this.web3.currentProvider as (HttpProvider|WebsocketProvider)).send({
          jsonrpc: `2.0`,
          method: `eth_signTypedData_v4`,
          params: [from, JSON.stringify(message)]
        }, (error, value) => {
          if (error)
            reject(error);
          else resolve(value?.result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Produces a "sign message" event conforming with both EIP712 and EIP4361
   */
  protected async eip4361(eip4361Message: EIP4361Message) {
    const {chainId, version, address, contractName: name} = eip4361Message;
    const verifyingContract = this.contractAddress || address;

    const message = {
      domain: {chainId, name, verifyingContract, version},
      message: eip4361Message,
      primaryType: "EIP4361",
      types: {EIP4361, EIP712Domain}
    }

    return this.sendTypedData(message, (await this.web3.eth.getAccounts())[0])
  }



}
