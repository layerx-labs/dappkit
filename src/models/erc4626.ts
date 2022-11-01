import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';

import ERC4626Json from '@abi/ERC4626.json';
import { ERC4626Methods } from '@methods/erc4626';
// import * as Events from '@events/erc4626'
// import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';

export class ERC4626 extends Model<ERC4626Methods> implements Deployable {
  // private _decimals = 0;

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, ERC4626Json.abi as AbiItem[], contractAddress);
  }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async loadContract() {
    if (!this.contract)
      super.loadContract();

    // this._decimals = await this.callTx(this.contract.methods.decimals()) || 18;
  }

  async deployJsonAbi(_asset: string) {
    const deployOptions = {
      data: ERC4626Json.bytecode,
      arguments: [
        _asset
      ]
    }
    return this.deploy(deployOptions, this.connection.Account);
  }

  async allowance(owner: string, spender: string) { 
    return this.callTx(this.contract.methods.allowance(owner, spender));
  }

  async approve(spender: string, amount: number) { 
    return this.sendTx(this.contract.methods.approve(spender, amount));
  }

  async balanceOf(account: string) { 
    return this.callTx(this.contract.methods.balanceOf(account));
  }

  async decreaseAllowance(spender: string, subtractedValue: number) { 
    return this.sendTx(this.contract.methods.decreaseAllowance(spender, subtractedValue));
  }

  async increaseAllowance(spender: string, addedValue: number) { 
    return this.sendTx(this.contract.methods.increaseAllowance(spender, addedValue));
  }

  async name() { 
    return this.callTx(this.contract.methods.name());
  }

  async symbol() { 
    return this.callTx(this.contract.methods.symbol());
  }

  async totalSupply() { 
    return this.callTx(this.contract.methods.totalSupply());
  }

  async transfer(recipient: string, amount: number) { 
    return this.sendTx(this.contract.methods.transfer(recipient, amount));
  }

  async transferFrom(sender: string, recipient: string, amount: number) { 
    return this.sendTx(this.contract.methods.transferFrom(sender, recipient, amount));
  }

  async decimals() { 
    return this.callTx(this.contract.methods.decimals());
  }

  async asset() { 
    return this.callTx(this.contract.methods.asset());
  }

  async totalAssets() { 
    return this.callTx(this.contract.methods.totalAssets());
  }

  async convertToShares(assets: number) { 
    return this.callTx(this.contract.methods.convertToShares(assets));
  }

  async convertToAssets(shares: number) { 
    return this.callTx(this.contract.methods.convertToAssets(shares));
  }

  async maxDeposit(arg1: string) { 
    return this.callTx(this.contract.methods.maxDeposit(arg1));
  }

  async maxMint(arg1: string) { 
    return this.callTx(this.contract.methods.maxMint(arg1));
  }

  async maxWithdraw(owner: string) { 
    return this.callTx(this.contract.methods.maxWithdraw(owner));
  }

  async maxRedeem(owner: string) { 
    return this.callTx(this.contract.methods.maxRedeem(owner));
  }

  async previewDeposit(assets: number) { 
    return this.callTx(this.contract.methods.previewDeposit(assets));
  }

  async previewMint(shares: number) { 
    return this.callTx(this.contract.methods.previewMint(shares));
  }

  async previewRedeem(shares: number) { 
    return this.callTx(this.contract.methods.previewRedeem(shares));
  }

  async previewWithdraw(assets: number) { 
    return this.callTx(this.contract.methods.previewWithdraw(assets));
  }

  async deposit(assets: number, receiver: string) { 
    return this.sendTx(this.contract.methods.deposit(assets, receiver));
  }

  async mint(shares: number, receiver: string) { 
    return this.sendTx(this.contract.methods.mint(shares, receiver));
  }

  async withdraw(assets: number, receiver: string, owner: string) { 
    return this.sendTx(this.contract.methods.withdraw(assets, receiver, owner));
  }

  async redeem(shares: number, receiver: string, owner: string) { 
    return this.sendTx(this.contract.methods.redeem(shares, receiver, owner));
  }

  // async getApprovalEvents(filter: PastEventOptions): XPromiseEvent<Events.ApprovalEvent> {
  //   return this.contract.self.getPastEvents('Approval', filter);
  // }

  // async getDepositEvents(filter: PastEventOptions): XPromiseEvent<Events.DepositEvent> {
  //   return this.contract.self.getPastEvents('Deposit', filter);
  // }

  // async getTransferEvents(filter: PastEventOptions): XPromiseEvent<Events.TransferEvent> {
  //   return this.contract.self.getPastEvents('Transfer', filter);
  // }

  // async getWithdrawEvents(filter: PastEventOptions): XPromiseEvent<Events.WithdrawEvent> {
  //   return this.contract.self.getPastEvents('Withdraw', filter);
  // }

}