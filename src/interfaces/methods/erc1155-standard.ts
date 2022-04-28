import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface ERC1155StandardMethods {
  balanceOf(account: string, id: number): ContractCallMethod<number>;
  balanceOfBatch(accounts: string[], ids: number[]): ContractCallMethod<number[]>;
  isApprovedForAll(account: string, operator: string): ContractCallMethod<boolean>;
  safeBatchTransferFrom(from: string, to: string, ids: number[], amounts: number[], data: string): ContractSendMethod;
  safeTransferFrom(from: string, to: string, id: number, amount: number, data: string): ContractSendMethod;
  setApprovalForAll(operator: string, approved: boolean): ContractSendMethod;
  supportsInterface(interfaceId: string): ContractCallMethod<boolean>;
  uri(v1: number): ContractCallMethod<string>;
  setURI(uri: string): ContractSendMethod;
  mint(to: string, tokenId: number, amount: number, data: string): ContractSendMethod;
  mintBatch(to: string, tokenIds: number[], amounts: number[], data: string): ContractSendMethod;
} 