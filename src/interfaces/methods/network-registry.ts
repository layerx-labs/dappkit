import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface Network_RegistryMethods {


  _governor(): ContractCallMethod<string>;

  _proposedGovernor(): ContractCallMethod<string>;

  claimGovernor(): ContractSendMethod;

  erc20(): ContractCallMethod<string>;

  lockAmountForNetworkCreation(): ContractCallMethod<number>;

  lockedTokensOfAddress(v1: string): ContractCallMethod<number>;

  networkOfAddress(v1: string): ContractCallMethod<string>;

  networksArray(v1: number): ContractCallMethod<string>;

  proposeGovernor(proposedGovernor: string): ContractSendMethod;

  totalLockedAmount(): ContractCallMethod<number>;

  lockFeePercentage(): ContractCallMethod<number>;

  treasury(): ContractCallMethod<string>;

  changeLockPercentageFee(newAmount: number): ContractSendMethod;

  amountOfNetworks(): ContractCallMethod<number>;

  lock(_amount: number): ContractSendMethod;

  unlock(): ContractSendMethod;

  registerNetwork(networkAddress: string): ContractSendMethod;

  changeAmountForNetworkCreation(newAmount: number): ContractSendMethod;
  changeGlobalFees(closeFee: number, cancelFee: number): ContractSendMethod;
  addAllowedTokens(tokens: string[], isTransactional: boolean): ContractSendMethod;
  removeAllowedTokens(tokens: number[], isTransactional: boolean): ContractSendMethod;

  getAllowedTokens(): ContractCallMethod<{ transactional: string[], reward: string[] }>;
  allowedTokens(x: number, y: number): ContractCallMethod<string>;

}