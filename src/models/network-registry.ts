import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import { ERC20 } from '@models/erc20';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {XEvents, XPromiseEvent} from '@events/x-events';

import Network_RegistryJson from '@abi/NetworkRegistry.json';
import { Network_RegistryMethods } from '@methods/network-registry';
import * as Events from '@events/network-registry'
import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';
import { fromSmartContractDecimals, toSmartContractDecimals } from '@utils/numbers';
import {nativeZeroAddress} from "@utils/constants";
import {Governed} from "@base/governed";
import {allowedTokens as _allowedTokens} from "@utils/allowed-tokens";
import {BountyToken} from "@models/bounty-token";

export class Network_Registry extends Model<Network_RegistryMethods> implements Deployable {
  private _token!: ERC20;
  private _governed!: Governed;
  private _bountyToken!: BountyToken;
  private _DIVISOR!: number;

  get token() { return this._token; }
  get governed() { return this._governed; }
  get bountyToken() { return this._bountyToken; }
  get divisor() { return this._DIVISOR; }

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, Network_RegistryJson.abi as AbiItem[], contractAddress);
  }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async loadContract() {
    if (!this.contract)
      return;

    const erc20Address = await this.erc20();
    const bountyTokenAddress = await this.bountyTokenAddress();

    this._token = new ERC20(this.connection, erc20Address);
    this._bountyToken = new BountyToken(this.connection, bountyTokenAddress);
    this._governed = new Governed(this);

    this._DIVISOR = await this.getDivisor();

    await this._token.start();
    await this._bountyToken.start();
  }

  async deployJsonAbi(_erc20: string,
                      _lockAmountForNetworkCreation: number,
                      treasury: string,
                      lockFeePercentage: number,
                      closeFee = 10000,
                      cancelFee = 20000,
                      bountyToken = nativeZeroAddress) {

    const token = new ERC20(this.connection, _erc20);

    await token.start();

    const deployOptions = {
      data: Network_RegistryJson.bytecode,
      arguments: [
        _erc20, toSmartContractDecimals(_lockAmountForNetworkCreation, token.decimals), treasury, lockFeePercentage,
        closeFee, cancelFee, bountyToken,
      ]
    }
    return this.deploy(deployOptions, this.connection.Account);
  }

  async erc20() {
    return this.callTx(this.contract.methods.erc20());
  }

  async bountyTokenAddress() {
    return this.callTx(this.contract.methods.bountyToken());
  }

  async getDivisor() {
    return this.callTx(this.contract.methods.DIVISOR());
  }

  async getMAX_LOCK_PERCENTAGE_FEE() {
    return this.callTx(this.contract.methods.MAX_LOCK_PERCENTAGE_FEE());
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

  async networkCreationFeePercentage() {
    return +(await this.callTx(this.contract.methods.networkCreationFeePercentage())) / this.divisor;
  }

  async treasury() {
    return this.callTx(this.contract.methods.treasury());
  }

  async amountOfNetworks() { 
    return this.callTx(this.contract.methods.amountOfNetworks());
  }

  async lock(_amount: string | number) { 
    return this.sendTx(this.contract.methods.lock(toSmartContractDecimals(_amount, this.token.decimals)));
  }

  async unlock() { 
    return this.sendTx(this.contract.methods.unlock());
  }

  async registerNetwork(networkAddress: string) { 
    return this.sendTx(this.contract.methods.registerNetwork(networkAddress));
  }

  async changeAmountForNetworkCreation(newAmount: string | number) {
    newAmount = toSmartContractDecimals(newAmount, this.token.decimals);
    return this.sendTx(this.contract.methods.changeAmountForNetworkCreation(newAmount));
  }

  async changeNetworkCreationFee(newAmount: number) {
    return this.sendTx(this.contract.methods.changeNetworkCreationFee(newAmount * this.divisor));
  }

  async changeGlobalFees(closeFee: number, cancelFee: number) {
    return this.sendTx(this.contract.methods.changeGlobalFees(closeFee * this.divisor, cancelFee * this.divisor))
  }

  async addAllowedTokens(addresses: string[], isTransactional: boolean) {
    return this.sendTx(this.contract.methods.addAllowedTokens(addresses, isTransactional));
  }

  async removeAllowedTokens(addresses: string[], isTransactional: boolean) {
    return this.sendTx(this.contract.methods.removeAllowedTokens(addresses, isTransactional));
  }

  async getAllowedTokenLen(): Promise<number[]> {
    return Promise.all([
      this.callTx(this.contract.methods.getAllowedTokenLen(true)),
      this.callTx(this.contract.methods.getAllowedTokenLen(false)),
    ])
  }

  async getAllowedTokens() {
    const [t, r] = await this.getAllowedTokenLen();
    const max = Math.max(t, r);
    const transactional = [];
    const reward = [];

    for (let x = 0; x < max; x++) {
      if (x < t)
        transactional.push(await this.callTx(this.contract.methods.getAllowedToken(x, true)))
      if (x < r)
        reward.push(await this.callTx(this.contract.methods.getAllowedToken(x, false)))
    }

    return {transactional, reward};
  }

  async getGovernorTransferredEvents(filter: PastEventOptions): Promise<XEvents<Events.GovernorTransferredEvent>[]> {
    return this.contract.self.getPastEvents('GovernorTransferred', filter);
  }

  async getNetworkClosedEvents(filter: PastEventOptions): Promise<XEvents<Events.NetworkClosedEvent>[]> {
    return this.contract.self.getPastEvents('NetworkClosed', filter);
  }

  async getNetworkRegisteredEvents(filter: PastEventOptions): Promise<XEvents<Events.NetworkRegisteredEvent>[]> {
    return this.contract.self.getPastEvents('NetworkRegistered', filter);
  }

  async getUserLockedAmountChangedEvents(filter: PastEventOptions): XPromiseEvent<Events.UserLockedAmountChangedEvent> {
    return this.contract.self.getPastEvents('UserLockedAmountChanged', filter);
  }
  async getChangedFeeEvent(filter: PastEventOptions): XPromiseEvent<Events.ChangedFeeEvent> {
    return this.contract.self.getPastEvents('ChangedFee', filter);
  }
  async getChangeAllowedTokensEvents(filter: PastEventOptions): XPromiseEvent<Events.ChangeAllowedTokensEvent> {
    return this.contract.self.getPastEvents('ChangeAllowedTokens', filter);
  }
  async getLockFeeChangedEvents(filter: PastEventOptions): XPromiseEvent<Events.LockFeeChangedEvent> {
    return this.contract.self.getPastEvents('LockFeeChanged', filter);
  }
}

export class NetworkRegistry extends Network_Registry {}