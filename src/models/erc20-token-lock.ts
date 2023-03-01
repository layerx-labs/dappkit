import {Model} from '@base/model';
import {ERC20TokenLockMethods} from '@methods/erc20-token-lock';
import {Deployable} from '@interfaces/deployable';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import ERC20TokenLock from '@abi/ERC20TokenLock.json';
import {AbiItem} from 'web3-utils';
import {Errors} from '@interfaces/error-enum';
import {ERC20} from '@models/erc20';
import {fromDecimals, toSmartContractDate, toSmartContractDecimals} from '@utils/numbers';
import {lockedTokensInfo} from '@utils/locked-tokens-info';
import {Pausable} from '@base/pausable';
import {Ownable} from '@base/ownable';
import {IsOwnable, IsPausable} from '@interfaces/modifiers';

export class Erc20TokenLock extends Model<ERC20TokenLockMethods> implements Deployable, IsOwnable, IsPausable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, ERC20TokenLock.abi as AbiItem[], contractAddress);
  }

  private _erc20!: ERC20;
  private _pausable!: Pausable;
  private _ownable!: Ownable;

  get pausable() { return this._pausable }
  get ownable() { return this._ownable }
  get erc20() { return this._erc20; }

  async getMaxLock() {
    return fromDecimals(await this.callTx(this.contract.methods.maxAmountToLock()), this.erc20.decimals);
  }

  async getMinLock() {
    return fromDecimals(await this.callTx(this.contract.methods.minAmountToLock()), this.erc20.decimals);
  }

  async getERC20TokenAddress() {
    return this.callTx(this.contract.methods.erc20());
  }

  async totalAmountStaked() {
    return fromDecimals(await this.callTx(this.contract.methods.totalAmountStaked()), this.erc20.decimals);
  }

  async canRelease(address: string) {
    return this.callTx(this.contract.methods.canRelease(address));
  }

  async getLockedTokens(address: string) {
    return fromDecimals(await this.callTx(this.contract.methods.getLockedTokens(address)), this.erc20.decimals);
  }

  async getLockedTokensInfo(address: string) {
    return lockedTokensInfo(await this.callTx(this.contract.methods.getLockedTokensInfo(address)))
  }

  async setMaxAmountToLock(amount: number) {
    await this.ownable.onlyOwner();
    return this.sendTx(this.contract.methods
                           .setMaxAmountToLock(toSmartContractDecimals(amount, this.erc20.decimals)))
  }

  async setMinAmountToLock(amount: number) {
    await this.ownable.onlyOwner();
    return this.sendTx(this.contract.methods
                           .setMinAmountToLock(toSmartContractDecimals(amount, this.erc20.decimals)))
  }

  async approveERC20Transfer() {
    return this.erc20.approve(this.contractAddress!, await this.erc20.totalSupply());
  }

  async lock(amount: string | number, endDate: number) {
    await this.pausable.whenNotPaused();

    if (amount > (await this.getMaxLock()) || amount < (await this.getMinLock()))
      throw new Error(Errors.InvalidTokenAmount);

    if (!(await this.erc20.isApproved(this.contractAddress, amount)))
      throw new Error(Errors.InteractionIsNotAvailableCallApprove);

    const scAmount = toSmartContractDecimals(amount, this.erc20.decimals);
    const scEndDate = toSmartContractDate(endDate);

    return this.sendTx(this.contract.methods.lock(scAmount, scEndDate))
  }

  async release() {
    return this.sendTx(this.contract.methods.release())
  }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async loadContract() {
    if (!this.contract)
      super.loadContract();

    this._ownable = new Ownable(this);
    this._pausable = new Pausable(this);

    this._erc20 = new ERC20(this.connection, await this.getERC20TokenAddress());
    await this._erc20.loadContract();
  }

  deployJsonAbi(erc20ContractAddress: string) {
    if (!erc20ContractAddress && !this.erc20?.contractAddress)
      throw new Error(Errors.MissingTokenAddress);

    const options = {
      data: ERC20TokenLock.bytecode,
      arguments: [erc20ContractAddress || this.erc20.contractAddress]
    }

    return this.deploy(options, this.connection.Account);
  }
}
