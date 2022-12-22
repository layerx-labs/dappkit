import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface ERC4626Methods {


  allowance(owner: string, spender: string): ContractCallMethod<number>;

  approve(spender: string, amount: string): ContractSendMethod;

  balanceOf(account: string): ContractCallMethod<number>;

  decreaseAllowance(spender: string, subtractedValue: string): ContractSendMethod;

  increaseAllowance(spender: string, addedValue: string): ContractSendMethod;

  name(): ContractCallMethod<string>;

  symbol(): ContractCallMethod<string>;

  totalSupply(): ContractCallMethod<number>;

  transfer(recipient: string, amount: string): ContractSendMethod;

  transferFrom(sender: string, recipient: string, amount: string): ContractSendMethod;

  decimals(): ContractCallMethod<number>;

  asset(): ContractCallMethod<string>;

  totalAssets(): ContractCallMethod<number>;

  convertToShares(assets: string): ContractCallMethod<{ 'shares': number; }>;

  convertToAssets(shares: string): ContractCallMethod<{ 'assets': number; }>;

  maxDeposit(arg1: string): ContractCallMethod<number>;

  maxMint(arg1: string): ContractCallMethod<number>;

  maxWithdraw(owner: string): ContractCallMethod<number>;

  maxRedeem(owner: string): ContractCallMethod<number>;

  previewDeposit(assets: string): ContractCallMethod<number>;

  previewMint(shares: string): ContractCallMethod<number>;

  previewRedeem(shares: string): ContractCallMethod<number>;

  previewWithdraw(assets: string): ContractCallMethod<number>;

  deposit(assets: string, receiver: string): ContractSendMethod;

  mint(shares: string, receiver: string): ContractSendMethod;

  withdraw(assets: string, receiver: string, owner: string): ContractSendMethod;

  redeem(shares: string, receiver: string, owner: string): ContractSendMethod;

}