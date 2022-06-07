import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface Network_RegistryMethods {

  erc20(): ContractCallMethod<string>;

  lockAmountForNetworkCreation(): ContractCallMethod<number>;

  lockedTokensOfAddress(v1: string): ContractCallMethod<number>;

  networkOfAddress(v1: string): ContractCallMethod<string>;

  networksArray(v1: number): ContractCallMethod<string>;

  proposeGovernor(proposedGovernor: string): ContractSendMethod;

  totalLockedAmount(): ContractCallMethod<number>;

  lockFeePercentage(): ContractCallMethod<number>;

  treasury(): ContractCallMethod<string>;

  changeLockPercentageFee(): ContractSendMethod;

  amountOfNetworks(): ContractCallMethod<number>;

  lock(_amount: number): ContractSendMethod;

  unlock(): ContractSendMethod;

  registerNetwork(networkAddress: string): ContractSendMethod;

  changeAmountForNetworkCreation(newAmount: number): ContractSendMethod;

}