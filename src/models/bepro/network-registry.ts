import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {ERC20} from '@models/token/ERC20/erc20';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';

import {fromSmartContractDecimals, toSmartContractDecimals} from '@utils/numbers';
import {nativeZeroAddress} from "@utils/constants";
import {Governed} from "@base/governed";
import {BountyToken} from "@models/bepro/token/ERC721/bounty-token";
import artifact from "@interfaces/generated/abi/NetworkRegistry";
import {Filter} from "web3";
import {ContractConstructorArgs} from "web3-types";

export class Network_Registry extends Model<typeof artifact.abi> implements Deployable {
  private _token!: ERC20;
  private _governed!: Governed;
  private _bountyToken!: BountyToken;
  private _DIVISOR!: number;

  get token() { return this._token; }
  get governed() { return this._governed; }
  get bountyToken() { return this._bountyToken; }
  get divisor() { return this._DIVISOR; }

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
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
    this._governed = new Governed(this.connection, this.contractAddress);

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

    await token.start();

    const deployOptions = {
      data: artifact.bytecode,
      arguments: [
        _erc20, toSmartContractDecimals(_lockAmountForNetworkCreation, token.decimals), treasury, lockFeePercentage,
        closeFee, cancelFee, bountyToken,
      ] as ContractConstructorArgs<typeof artifact.abi>
    }
    return this.deploy(deployOptions, this.connection.Account);
  }

  async erc20() {
    return this.contract.methods.erc20().call();
  }

  async bountyTokenAddress() {
    return this.contract.methods.bountyToken().call()
  }

  async getDivisor() {
    return Number(await this.callTx<bigint>(this.contract.methods.DIVISOR()));
  }

  async getMAX_LOCK_PERCENTAGE_FEE() {
    return Number(await this.callTx<bigint>(this.contract.methods.MAX_LOCK_PERCENTAGE_FEE()));
  }

  async lockAmountForNetworkCreation() { 
    return fromSmartContractDecimals(await this.callTx<number>(this.contract.methods.lockAmountForNetworkCreation()),
                                     this.token.decimals);
  }

  async lockedTokensOfAddress(v1: string) { 
    return fromSmartContractDecimals(await this.callTx<bigint>(this.contract.methods.lockedTokensOfAddress(v1)),
                                     this.token.decimals);
  }

  async networkOfAddress(v1: string) { 
    return this.contract.methods.networkOfAddress(v1).call()
  }

  async networksArray(v1: number) { 
    return this.contract.methods.networksArray(v1).call();
  }

  async totalLockedAmount() { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalLockedAmount()), 
                                     this.token.decimals);
  }

  async networkCreationFeePercentage() {
    return Number(await this.callTx<bigint>(this.contract.methods.networkCreationFeePercentage())) / this.divisor;
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
      this.callTx<bigint>(this.contract.methods.getAllowedTokenLen(true)),
      this.callTx<bigint>(this.contract.methods.getAllowedTokenLen(false)),
    ]).then(p => p.map(v => Number(v)));
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

  async getGovernorTransferredEvents(filter: Filter) {
    return this.contract.self.getPastEvents('GovernorTransferred', filter);
  }

  async getNetworkClosedEvents(filter: Filter) {
    return this.contract.self.getPastEvents('NetworkClosed', filter);
  }

  async getNetworkRegisteredEvents(filter: Filter) {
    return this.contract.self.getPastEvents('NetworkRegistered', filter);
  }

  async getUserLockedAmountChangedEvents(filter: Filter) {
    return this.contract.self.getPastEvents('UserLockedAmountChanged', filter);
  }
  async getChangedFeeEvent(filter: Filter) {
    return this.contract.self.getPastEvents('ChangedFee', filter);
  }
  async getChangeAllowedTokensEvents(filter: Filter) {
    return this.contract.self.getPastEvents('ChangeAllowedTokens', filter);
  }
  async getLockFeeChangedEvents(filter: Filter) {
    return this.contract.self.getPastEvents('LockFeeChanged', filter);
  }
}

export class NetworkRegistry extends Network_Registry {}