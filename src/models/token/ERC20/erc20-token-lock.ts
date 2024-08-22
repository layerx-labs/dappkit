import {Model} from '@base/model';
import {Deployable} from '@interfaces/deployable';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';

import {Errors} from '@interfaces/error-enum';
import {ERC20} from '@models/token/ERC20/erc20';
import {fromDecimals, toSmartContractDate, toSmartContractDecimals} from '@utils/numbers';
import {lockedTokensInfo} from '@utils/models/locked-tokens-info';
import {Ownable} from '@base/ownable';
import {IsOwnable} from '@interfaces/modifiers';
import artifact from "@interfaces/generated/abi/ERC20TokenLock";
import {ContractConstructorArgs} from "web3-types/lib/types";


export class Erc20TokenLock extends Model<typeof artifact.abi> implements Deployable, IsOwnable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  private _erc20!: ERC20;
  private _ownable!: Ownable;

  get ownable() { return this._ownable }
  get erc20() { return this._erc20; }

  async getMaxLock() {
    return fromDecimals(await this.callTx(this.contract.methods.maxAmountToLock()), this.erc20.decimals);
  }

  async getMinLock() {
    return fromDecimals(await this.callTx(this.contract.methods.minAmountToLock()), this.erc20.decimals);
  }

  async getERC20TokenAddress() {
    return this.contract.methods.erc20().call()
    //return this.callTx(this.contract.methods.erc20());
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

    if (this.contract) {
      this._ownable = new Ownable(this.connection, this.contractAddress);

      this._erc20 = new ERC20(this.connection, (await this.getERC20TokenAddress()) as string);
      await this._erc20.start();
    }
  }

  deployJsonAbi(erc20ContractAddress: string) {
    if (!erc20ContractAddress && !this.erc20?.contractAddress)
      throw new Error(Errors.MissingTokenAddress);

    const options = {
      data: artifact.bytecode,
      arguments: [erc20ContractAddress || this.erc20.contractAddress] as ContractConstructorArgs<typeof artifact.abi>
    }

    return this.deploy(options, this.connection.Account);
  }
}
