import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';

import {ERC20} from "@models/token/ERC20/erc20";
import {fromSmartContractDecimals, toSmartContractDecimals} from "@utils/numbers";

import artifact from "@interfaces/generated/abi/ERC4626";
import {ContractConstructorArgs} from "web3-types/lib/types";
import {Filter} from "web3";

export class ERC4626 extends Model<typeof artifact.abi> implements Deployable {
  private _decimals = -1;
  private _asset: ERC20|null = null;

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  async deployJsonAbi(erc20Address: string, name: string, symbol: string) {
    const deployOptions = {
      data: artifact.bytecode,
      arguments: [
        erc20Address,
        name, symbol,
      ] as ContractConstructorArgs<typeof artifact.abi>
    }
    return this.deploy(deployOptions, this.connection.Account);
  }

  async start() {
    await super.start();

    if (!this.contract)
      return;

    this._decimals = await this.decimals();
    this._asset = new ERC20(this.connection, await this.assetAddress());
    await this._asset.start();
  }

  async allowance(owner: string, spender: string) {
    return this.callTx<number>(this.contract.methods.allowance(owner, spender))
      .then(value => fromSmartContractDecimals(value, this._decimals))
  }

  async approve(spender: string, amount: number) { 
    return this.sendTx(this.contract.methods.approve(spender, toSmartContractDecimals(amount, this._decimals)));
  }

  async balanceOf(account: string) {
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods.balanceOf(account)), this._decimals);
  }

  async decreaseAllowance(spender: string, subtractedValue: number) {
    return this.sendTx(this.contract
      .methods.decreaseAllowance(spender, toSmartContractDecimals(subtractedValue, this._decimals)));
  }

  async increaseAllowance(spender: string, addedValue: number) { 
    return this.sendTx(this.contract.methods.increaseAllowance(spender, toSmartContractDecimals(addedValue)));
  }

  async name() { 
    return this.callTx(this.contract.methods.name());
  }

  async symbol() { 
    return this.callTx(this.contract.methods.symbol());
  }

  async totalSupply() { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalSupply()), this._decimals);
  }

  async transfer(recipient: string, amount: number) { 
    return this.sendTx(this.contract.methods.transfer(recipient, toSmartContractDecimals(amount, this._decimals)));
  }

  async transferFrom(sender: string, recipient: string, amount: number) { 
    return this.sendTx(this.contract
      .methods.transferFrom(sender, recipient, toSmartContractDecimals(amount, this._decimals)));
  }

  async decimals() {
    if (this._decimals > -1)
      return this._decimals;

    return Number(await this.callTx<bigint>(this.contract.methods.decimals()));
  }

  get asset() { return this._asset; }

  async assetAddress() {
    return this.callTx<string>(this.contract.methods.asset());
  }

  async totalAssets() {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalAssets()), this._decimals);
  }

  async convertToShares(assets: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods
      .convertToShares(toSmartContractDecimals(assets, this.asset?.decimals, 3))), this._decimals, 3);
  }

  async convertToAssets(shares: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods
      .convertToAssets(toSmartContractDecimals(shares, this._decimals, 3))), this.asset?.decimals, 3);
  }

  async maxDeposit(arg1: string) { 
    return this.callTx(this.contract.methods.maxDeposit(arg1));
  }

  async maxMint(arg1: string) { 
    return this.callTx(this.contract.methods.maxMint(arg1));
  }

  async maxWithdraw(owner: string) {
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods.maxWithdraw(owner)), this.asset?.decimals, 3);
  }

  async maxRedeem(owner: string) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.maxRedeem(owner)), this._decimals);
  }

  async previewDeposit(assets: number) {
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods
      .previewDeposit(toSmartContractDecimals(assets, this.asset?.decimals, 3))), this._decimals, 3);
  }

  async previewMint(shares: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods
      .previewMint(toSmartContractDecimals(shares, this._decimals, 2))), this.asset?.decimals, 2);
  }

  async previewRedeem(shares: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods
      .previewRedeem(toSmartContractDecimals(shares, this._decimals, 3))), this.asset?.decimals, 3);
  }

  async previewWithdraw(assets: number|string) {
    return fromSmartContractDecimals(await this.callTx(this.contract
      .methods
      .previewWithdraw(toSmartContractDecimals(assets, this.asset?.decimals, 2))), this._decimals, 2);
  }

  async deposit(assets: number, receiver: string) { 
    return this.sendTx(this.contract
      .methods.deposit(toSmartContractDecimals(assets, this.asset?.decimals, 3), receiver));
  }

  async mint(shares: number, receiver: string) {
    return this.sendTx(this.contract.methods.mint(toSmartContractDecimals(shares, this._decimals, 3), receiver));
  }

  async withdraw(assets: number|string, receiver: string, owner: string) {
    return this.sendTx(this.contract
      .methods.withdraw(toSmartContractDecimals(assets, this.asset?.decimals, 3), receiver, owner));
  }

  async redeem(shares: number|string, receiver: string, owner: string) {
    return this.sendTx(this.contract
      .methods.redeem(toSmartContractDecimals(shares, this._decimals, 3), receiver, owner));
  }

  async getApprovalEvents(filter: Filter) {
    return this.contract.self.getPastEvents('Approval', filter);
  }

  async getDepositEvents(filter: Filter) {
    return this.contract.self.getPastEvents('Deposit', filter);
  }

  async getTransferEvents(filter: Filter) {
    return this.contract.self.getPastEvents('Transfer', filter);
  }

  async getWithdrawEvents(filter: Filter) {
    return this.contract.self.getPastEvents('Withdraw', filter);
  }

}