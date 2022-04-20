import {Model} from '@base/model';
import {NetworkFactoryV2Methods} from '@methods/network-factory-v2';
import {Deployable} from '@interfaces/deployable';
import {TransactionReceipt} from '@interfaces/web3-core';
import NetworkFactoryV2Abi from '@abi/NetworkFactory_v2.json';
import {Web3Connection} from '@base/web3-connection';
import {AbiItem} from 'web3-utils';
import {ERC20} from '@models/erc20';
import {fromDecimals, toSmartContractDecimals} from '@utils/numbers';
import {Errors} from '@interfaces/error-enum';
import {MANAGE_FUNDS} from '@utils/constants';

export class NetworkFactoryV2 extends Model<NetworkFactoryV2Methods> implements Deployable {
  private _erc20!: ERC20;
  get erc20() { return this._erc20; }

  constructor(web3Connection: Web3Connection, contractAddress?: string) {
    super(web3Connection, NetworkFactoryV2Abi.abi as AbiItem[], contractAddress);
  }

  async networksArray(index: number) {
    return this.callTx(this.contract.methods.networksArray(index));
  }

  async erc20NetworkToken() {
    return this.callTx(this.contract.methods.erc20NetworkToken());
  }

  async creatorAmount() {
    return +fromDecimals(await this.callTx(this.contract.methods.creatorAmount()), this.erc20.decimals);
  }

  async tokensLocked() {
    return +fromDecimals(await this.callTx(this.contract.methods.tokensLocked()), this.erc20.decimals);
  }

  async amountOfNetworks() {
    return +(await this.callTx(this.contract.methods.amountOfNetworks()));
  }

  async lockedTokensOfAddress(address: string) {
    return +fromDecimals(await this.callTx(this.contract.methods.lockedTokensOfAddress(address)), this.erc20.decimals);
  }

  async networkOfAddress(address: string) {
    return this.callTx(this.contract.methods.networkOfAddress(address));
  }

  async lock(amount: number) {
    if (amount <= 0)
      throw new Error(Errors.AmountNeedsToBeHigherThanZero);

    return this.sendTx(this.contract.methods.manageFunds(MANAGE_FUNDS.Lock, 
                                                         toSmartContractDecimals(amount, this.erc20.decimals)));
  }

  async unlock() {
    return this.sendTx(this.contract.methods.manageFunds(MANAGE_FUNDS.Unlock,
                                                         toSmartContractDecimals(0, this.erc20.decimals)));
  }

  async createNetwork(_networkToken: string, _nftToken: string, _nftUri: string) {
    return this.sendTx(this.contract.methods.createNetwork(_networkToken, _nftToken, _nftUri));
  }

  async isAbleToCreateNetwork(address: string) {
    return await this.lockedTokensOfAddress(address) >= await this.creatorAmount();
  }


  async approveNetworkToken(amount: number) {
    return this.erc20.approve(this.contractAddress!, amount);
  }

  async isApprovedNetworkToken(amount: number) {
    return this.erc20.isApproved(this.contractAddress!, amount);
  }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async loadContract() {
    if (!this.contract)
      super.loadContract();

    this._erc20 = new ERC20(this.web3Connection, await this.erc20NetworkToken());
    await this._erc20.loadContract();
  }

  deployJsonAbi(erc20ContractAddress: string): Promise<TransactionReceipt> {
    const deployOptions = {
      data: NetworkFactoryV2Abi.bytecode,
      arguments: [erc20ContractAddress]
    }

    return this.deploy(deployOptions, this.web3Connection.Account);
  }
}
