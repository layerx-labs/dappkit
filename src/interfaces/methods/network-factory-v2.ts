import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface NetworkFactoryV2Methods {
  networksArray(index: number): ContractCallMethod<string>;
  erc20NetworkToken(): ContractCallMethod<string>;
  creatorAmount(): ContractCallMethod<number>;
  tokensLocked(): ContractCallMethod<number>;
  amountOfNetworks(): ContractCallMethod<number>;
  lockedTokensOfAddress(address: string): ContractCallMethod<number>;
  networkOfAddress(address: string): ContractCallMethod<string>;
  manageFunds(lock: boolean, tokenAmount: number): ContractSendMethod;
  createNetwork(networkToken: string, nftToken: string, nftUri: string, treasuryAddress: string, cancelFee: number, closeFee: number): ContractSendMethod;
}
