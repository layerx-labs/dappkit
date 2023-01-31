import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';

import ERC4626Json from '@abi/ERC4626.json';
import { ERC4626Methods } from '@methods/erc4626';
import * as Events from '@events/erc4626'
import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';
import {XPromiseEvent} from "@events/x-events";
import {ERC20} from "@models/erc20";
import {fromSmartContractDecimals, toSmartContractDecimals} from "@utils/numbers";

export class ERC4626 extends Model<ERC4626Methods> implements Deployable {
  private _decimals: number = -1;
  private _asset: ERC20|null = null;

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, ERC4626Json.abi as AbiItem[], contractAddress);
  }

  async deployJsonAbi(erc20Address: string, name: string, symbol: string) {
    const deployOptions = {
      data: ERC4626Json.bytecode,
      arguments: [
        erc20Address,
        name, symbol,
      ]
    }
    return this.deploy(deployOptions, this.connection.Account);
  }

  async loadContract() {
    super.loadContract();

    this._decimals = await this.decimals();
    this._asset = new ERC20(this.connection, await this.assetAddress());
  }

  async allowance(owner: string, spender: string) {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.allowance(owner, spender)), this._decimals);
  }

  async approve(spender: string, amount: number) { 
    return this.sendTx(this.contract.methods.approve(spender, toSmartContractDecimals(amount, this._decimals)));
  }

  async balanceOf(account: string) {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.balanceOf(account)), this._decimals, 3);
  }

  async decreaseAllowance(spender: string, subtractedValue: number) {
    return this.sendTx(this.contract.methods.decreaseAllowance(spender, toSmartContractDecimals(subtractedValue, this._decimals)));
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
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalSupply()), this._decimals, 3);
  }

  async transfer(recipient: string, amount: number) { 
    return this.sendTx(this.contract.methods.transfer(recipient, toSmartContractDecimals(amount, this._decimals)));
  }

  async transferFrom(sender: string, recipient: string, amount: number) { 
    return this.sendTx(this.contract.methods.transferFrom(sender, recipient, toSmartContractDecimals(amount, this._decimals)));
  }

  async decimals() {
    if (this._decimals > -1)
      return this._decimals;

    return this.callTx(this.contract.methods.decimals());
  }

  get asset() { return this._asset; }

  async assetAddress() {
    return this.callTx(this.contract.methods.asset());
  }

  async totalAssets() {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalAssets()), this._decimals, 3);
  }

  async convertToShares(assets: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.convertToShares(toSmartContractDecimals(assets, this._decimals, 3))), this._decimals, 3);
  }

  async convertToAssets(shares: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.convertToAssets(toSmartContractDecimals(shares, this._decimals, 3))), this._decimals, 3);
  }

  async maxDeposit(arg1: string) { 
    return await this.callTx(this.contract.methods.maxDeposit(arg1));
  }

  async maxMint(arg1: string) { 
    return await this.callTx(this.contract.methods.maxMint(arg1));
  }

  async maxWithdraw(owner: string) {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.maxWithdraw(owner)), this._decimals, 3);
  }

  async maxRedeem(owner: string) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.maxRedeem(owner)), this._decimals);
  }

  async previewDeposit(assets: number) {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.previewDeposit(toSmartContractDecimals(assets, this._decimals, 3))), this._decimals, 3);
  }

  async previewMint(shares: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.previewMint(toSmartContractDecimals(shares, this._decimals, 2))), this._decimals, 2);
  }

  async previewRedeem(shares: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.previewRedeem(toSmartContractDecimals(shares, this._decimals, 3))), this._decimals, 3);
  }

  async previewWithdraw(assets: number) { 
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.previewWithdraw(toSmartContractDecimals(assets, this._decimals, 2))), this._decimals, 2);
  }

  async deposit(assets: number, receiver: string) { 
    return this.sendTx(this.contract.methods.deposit(toSmartContractDecimals(assets, this._decimals, 3), receiver));
  }

  async mint(shares: number, receiver: string) {
    return this.sendTx(this.contract.methods.mint(toSmartContractDecimals(shares, this._decimals, 3), receiver));
  }

  async withdraw(assets: number, receiver: string, owner: string) { 
    return this.sendTx(this.contract.methods.withdraw(toSmartContractDecimals(assets, this._decimals, 3), receiver, owner));
  }

  async redeem(shares: number, receiver: string, owner: string) { 
    return this.sendTx(this.contract.methods.redeem(toSmartContractDecimals(shares, this._decimals, 3), receiver, owner));
  }

  async getApprovalEvents(filter: PastEventOptions): XPromiseEvent<Events.ApprovalEvent> {
    return this.contract.self.getPastEvents('Approval', filter);
  }

  async getDepositEvents(filter: PastEventOptions): XPromiseEvent<Events.DepositEvent> {
    return this.contract.self.getPastEvents('Deposit', filter);
  }

  async getTransferEvents(filter: PastEventOptions): XPromiseEvent<Events.TransferEvent> {
    return this.contract.self.getPastEvents('Transfer', filter);
  }

  async getWithdrawEvents(filter: PastEventOptions): XPromiseEvent<Events.WithdrawEvent> {
    return this.contract.self.getPastEvents('Withdraw', filter);
  }

}