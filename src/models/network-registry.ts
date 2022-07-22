import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import { ERC20 } from '@models/erc20';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {XEvents, XPromiseEvent} from '@events/x-events';

import Network_RegistryJson from '@abi/Network_Registry.json';
import { Network_RegistryMethods } from '@methods/network-registry';
import * as Events from '@events/network-registry'
import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';
import { fromSmartContractDecimals, toSmartContractDecimals } from '@utils/numbers';
import {TenK} from "@utils/constants";
import {Governed} from "@base/governed";
import {allowedTokens as _allowedTokens} from "@utils/allowed-tokens";

export class Network_Registry extends Model<Network_RegistryMethods> implements Deployable {
  private _token!: ERC20;
  private _governed!: Governed;

  get token() { return this._token; }
  get governed() { return this._governed; }

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, Network_RegistryJson.abi as AbiItem[], contractAddress);
  }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async loadContract() {
    if (!this.contract)
      await super.loadContract();

    const erc20Address = await this.erc20();

    this._token = new ERC20(this.connection, erc20Address);
    this._governed = new Governed(this);

    await this._token.loadContract();
  }

  async deployJsonAbi(_erc20: string,
                      _lockAmountForNetworkCreation: number,
                      treasury: string,
                      lockFeePercentage: number,
                      closeFee = 10000,
                      cancelFee = 20000) {

    const token = new ERC20(this.connection, _erc20);
    await token.loadContract();

    const deployOptions = {
      data: Network_RegistryJson.bytecode,
      arguments: [
        _erc20, toSmartContractDecimals(_lockAmountForNetworkCreation, token.decimals), treasury, lockFeePercentage,
        closeFee, cancelFee
      ]
    }
    return this.deploy(deployOptions, this.connection.Account);
  }

  async erc20() {
    return this.callTx(this.contract.methods.erc20());
  }

  async lockAmountForNetworkCreation() { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.lockAmountForNetworkCreation()), 
                                     this.token.decimals);
  }

  async lockedTokensOfAddress(v1: string) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.lockedTokensOfAddress(v1)), 
                                     this.token.decimals);
  }

  async networkOfAddress(v1: string) { 
    return this.callTx(this.contract.methods.networkOfAddress(v1));
  }

  async networksArray(v1: number) { 
    return this.callTx(this.contract.methods.networksArray(v1));
  }

  async totalLockedAmount() { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalLockedAmount()), 
                                     this.token.decimals);
  }

  async lockFeePercentage() {
    return +(await this.callTx(this.contract.methods.lockFeePercentage())) / TenK;
  }

  async treasury() {
    return this.callTx(this.contract.methods.treasury());
  }

  async amountOfNetworks() { 
    return this.callTx(this.contract.methods.amountOfNetworks());
  }

  async lock(_amount: number) { 
    return this.sendTx(this.contract.methods.lock(toSmartContractDecimals(_amount, this.token.decimals)));
  }

  async unlock() { 
    return this.sendTx(this.contract.methods.unlock());
  }

  async registerNetwork(networkAddress: string) { 
    return this.sendTx(this.contract.methods.registerNetwork(networkAddress));
  }

  async changeAmountForNetworkCreation(newAmount: number) {
    newAmount = toSmartContractDecimals(newAmount, this.token.decimals);
    return this.sendTx(this.contract.methods.changeAmountForNetworkCreation(newAmount));
  }

  async changeLockPercentageFee(newAmount: number) {
    return this.sendTx(this.contract.methods.changeLockPercentageFee(newAmount * TenK));
  }

  async changeGlobalFees(closeFee: number, cancelFee: number) {
    return this.sendTx(this.contract.methods.changeGlobalFees(closeFee * TenK, cancelFee * TenK))
  }

  async addAllowedTokens(addresses: string[], isTransactional: boolean) {
    return this.sendTx(this.contract.methods.addAllowedTokens(addresses, isTransactional));
  }

  async removeAllowedTokens(addressIds: number[], isTransactional: boolean) {
    return this.sendTx(this.contract.methods.removeAllowedTokens(addressIds, isTransactional));
  }

  async getAllowedTokens() {
    return _allowedTokens(await this.callTx(this.contract.methods.getAllowedTokens()));
  }

  async allowedTokens(x: number, y: number) {
    return this.callTx(this.contract.methods.allowedTokens(x, y));
  }

  async getGovernorTransferredEvents(filter: PastEventOptions): Promise<XEvents<Events.GovernorTransferredEvent>[]> {
    return this.contract.self.getPastEvents('GovernorTransferred', filter);
  }
  async getNetworkClosedEvents(filter: PastEventOptions): Promise<XEvents<Events.NetworkClosedEvent>[]> {
    return this.contract.self.getPastEvents('NetworkClosed', filter);
  }
  async getNetworkCreatedEvents(filter: PastEventOptions): Promise<XEvents<Events.NetworkCreatedEvent>[]> {
    return this.contract.self.getPastEvents('NetworkCreated', filter);
  }

  async getUserLockedAmountChangedEvents(filter: PastEventOptions): XPromiseEvent<Events.UserLockedAmountChangedEvent> {
    return this.contract.self.getPastEvents('UserLockedAmountChanged', filter);
  }
}

export class NetworkRegistry extends Network_Registry {}