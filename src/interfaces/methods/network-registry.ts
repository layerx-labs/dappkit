import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface Network_RegistryMethods {


  _governor(): ContractCallMethod<string>;

  _proposedGovernor(): ContractCallMethod<string>;

  claimGovernor(): ContractSendMethod;

  erc20(): ContractCallMethod<string>;
  bountyToken(): ContractCallMethod<string>;

  lockAmountForNetworkCreation(): ContractCallMethod<number>;

  lockedTokensOfAddress(v1: string): ContractCallMethod<number>;

  networkOfAddress(v1: string): ContractCallMethod<string>;

  networksArray(v1: number): ContractCallMethod<string>;

  proposeGovernor(proposedGovernor: string): ContractSendMethod;

  totalLockedAmount(): ContractCallMethod<number>;

  networkCreationFeePercentage(): ContractCallMethod<number>;

  treasury(): ContractCallMethod<string>;

  changeNetworkCreationFee(newAmount: number): ContractSendMethod;

  amountOfNetworks(): ContractCallMethod<number>;

  lock(_amount: number): ContractSendMethod;

  unlock(): ContractSendMethod;

  registerNetwork(networkAddress: string): ContractSendMethod;

  changeAmountForNetworkCreation(newAmount: number): ContractSendMethod;
  changeGlobalFees(closeFee: number, cancelFee: number): ContractSendMethod;
  addAllowedTokens(tokens: string[], isTransactional: boolean): ContractSendMethod;
  removeAllowedTokens(tokens: string[], isTransactional: boolean): ContractSendMethod;

  getAllowedToken(x: number, transactional: boolean): ContractCallMethod<string>;
  getAllowedTokenLen(transactional: boolean): ContractCallMethod<number>;

  DIVISOR(): ContractCallMethod<number>;
  MAX_PERCENTAGE(): ContractCallMethod<number>;

}