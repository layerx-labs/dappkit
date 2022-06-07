import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {XEvents} from '@events/x-events';
import ERC1155StandardJson from '@abi/ERC1155Standard.json';
import {ERC1155StandardMethods} from '@methods/erc1155-standard';
import * as Events from '@events/erc1155-standard-events';
import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';

export class ERC1155Standard extends Model<ERC1155StandardMethods> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, ERC1155StandardJson.abi as AbiItem[], contractAddress);
  }

  async deployJsonAbi(uri: string) {
    const deployOptions = {
        data: ERC1155StandardJson.bytecode,
        arguments: [uri]
    };

    return this.deploy(deployOptions, this.connection.Account);
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