import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface ERC20Methods {
  allowance(owner: string, spender: string): ContractCallMethod<number>;
  approve(spender: string, amount: string | number): ContractCallMethod<boolean>;
  balanceOf(account: string): ContractCallMethod<number>;
  decimals(): ContractCallMethod<number>;
  decreaseAllowance(spender: string, subtractedValue: number): ContractCallMethod<boolean>;
  distributionContract(): ContractCallMethod<string>;
  increaseAllowance(spender: string, addedValue: string | number): ContractCallMethod<boolean>;
  name(): ContractCallMethod<string>;
  owner(): ContractCallMethod<string>;
  symbol(): ContractCallMethod<string>;
  totalSupply(): ContractCallMethod<number>;
  transfer(recipient: string, amount: string | number): ContractCallMethod<boolean>;
  transferFrom(sender: string, recipient: string, amount: string | number): ContractCallMethod<boolean>;
  transferOwnership(newOwner: string): ContractSendMethod;
  mint(receiver: string, amount: string): ContractSendMethod;
}
