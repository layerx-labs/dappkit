import { Model } from '@base/model';
import { Web3Connection } from '@base/web3-connection';
import { Web3ConnectionOptions } from '@interfaces/web3-connection-options';
import { Deployable } from '@interfaces/deployable';
import { XEvents } from '@events/x-events';
import ERC1155OwnableJson from '@abi/ERC1155Ownable.json';
import { ERC1155OwnableMethods } from '@methods/erc1155-ownable';
import * as Events from '@events/erc1155-ownable-events';
import { PastEventOptions } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

export class ERC1155Ownable extends Model<ERC1155OwnableMethods> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, ERC1155OwnableJson.abi as AbiItem[], contractAddress);
  }

  async deployJsonAbi(uri: string) {
    const deployOptions = {
        data: ERC1155OwnableJson.bytecode,
        arguments: [uri]
    };

    return this.deploy(deployOptions, this.web3Connection.Account);
  }

  async balanceOf(account: string, id: number){
    return Number(await this.callTx(this.contract.methods.balanceOf(account, id))); 
  }

  async balanceOfBatch(accounts: string[], ids: number[]){
    return (await this.callTx(this.contract.methods.balanceOfBatch(accounts, ids)))
    .map((balance) => Number(balance)); 
  }

  async isApprovedForAll(account: string, operator: string){
    return this.callTx(this.contract.methods.isApprovedForAll(account, operator)); 
  }

  async owner(){
    return this.callTx(this.contract.methods.owner()); 
  }

  async safeBatchTransferFrom(from: string, to: string, ids: number[], amounts: number[], data: string){
    return this.sendTx(this.contract.methods.safeBatchTransferFrom(from, to, ids, amounts, data)); 
  }

  async safeTransferFrom(from: string, to: string, id: number, amount: number, data: string){
    return this.sendTx(this.contract.methods.safeTransferFrom(from, to, id, amount, data)); 
  }

  async setApprovalForAll(operator: string, approved: boolean){
    return this.sendTx(this.contract.methods.setApprovalForAll(operator, approved)); 
  }

  async supportsInterface(interfaceId: string){
    return this.callTx(this.contract.methods.supportsInterface(interfaceId)); 
  }

  async transferOwnership(newOwner: string){
    return this.sendTx(this.contract.methods.transferOwnership(newOwner)); 
  }

  async uri(v1: number){
    return this.callTx(this.contract.methods.uri(v1)); 
  }

  async setURI(uri: string){
    return this.sendTx(this.contract.methods.setURI(uri)); 
  }

  async mint(to: string, tokenId: number, amount: number, data: string){
    return this.sendTx(this.contract.methods.mint(to, tokenId, amount, data)); 
  }

  async mintBatch(to: string, tokenIds: number[], amounts: number[], data: string){
    return this.sendTx(this.contract.methods.mintBatch(to, tokenIds, amounts, data)); 
  }

  async getApprovalForAllEvents(filter: PastEventOptions): Promise<XEvents<Events.ApprovalForAllEvent>[]> {
    return this.contract.self.getPastEvents(`ApprovalForAll`, filter)
  }

  async getOwnershipTransferredEvents(filter: PastEventOptions): Promise<XEvents<Events.OwnershipTransferredEvent>[]> {
    return this.contract.self.getPastEvents(`OwnershipTransferred`, filter)
  }

  async getTransferBatchEvents(filter: PastEventOptions): Promise<XEvents<Events.TransferBatchEvent>[]> {
    return this.contract.self.getPastEvents(`TransferBatch`, filter)
  }

  async getTransferSingleEvents(filter: PastEventOptions): Promise<XEvents<Events.TransferSingleEvent>[]> {
    return this.contract.self.getPastEvents(`TransferSingle`, filter)
  }

  async getURIEvents(filter: PastEventOptions): Promise<XEvents<Events.URIEvent>[]> {
    return this.contract.self.getPastEvents(`URI`, filter)
  }
}
