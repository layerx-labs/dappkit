import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface ERC4626Methods {


    allowance(owner: string, spender: string): ContractCallMethod<number>;

  approve(spender: string, amount: number): ContractSendMethod;

  balanceOf(account: string): ContractCallMethod<number>;

  decreaseAllowance(spender: string, subtractedValue: number): ContractSendMethod;

  increaseAllowance(spender: string, addedValue: number): ContractSendMethod;

  name(): ContractCallMethod<string>;

  symbol(): ContractCallMethod<string>;

  totalSupply(): ContractCallMethod<number>;

  transfer(recipient: string, amount: number): ContractSendMethod;

  transferFrom(sender: string, recipient: string, amount: number): ContractSendMethod;

  decimals(): ContractCallMethod<number>;

  asset(): ContractCallMethod<string>;

  totalAssets(): ContractCallMethod<number>;

  convertToShares(assets: number): ContractCallMethod<{'shares': number;}>;

  convertToAssets(shares: number): ContractCallMethod<{'assets': number;}>;

  maxDeposit(arg1: string): ContractCallMethod<number>;

  maxMint(arg1: string): ContractCallMethod<number>;

  maxWithdraw(owner: string): ContractCallMethod<number>;

  maxRedeem(owner: string): ContractCallMethod<number>;

  previewDeposit(assets: number): ContractCallMethod<number>;

  previewMint(shares: number): ContractCallMethod<number>;

  previewRedeem(shares: number): ContractCallMethod<number>;

  previewWithdraw(assets: number): ContractCallMethod<number>;

  deposit(assets: number, receiver: string): ContractSendMethod;

  mint(shares: number, receiver: string): ContractSendMethod;

  withdraw(assets: number, receiver: string, owner: string): ContractSendMethod;

  redeem(shares: number, receiver: string, owner: string): ContractSendMethod;

}