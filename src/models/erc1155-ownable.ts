import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import artifact from "@interfaces/generated/abi/ERC1155Ownable";
import {ContractConstructorArgs} from "web3-types/lib/types";
import {Filter} from "web3";

export class ERC1155Ownable extends Model<typeof artifact.abi> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  async deployJsonAbi(uri: string) {
    const deployOptions = {
        data: artifact.bytecode,
        arguments: [uri] as ContractConstructorArgs<typeof artifact.abi>
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async balanceOf(account: string, id: number){
    return Number(await this.callTx(this.contract.methods.balanceOf(account, id))); 
  }

  async balanceOfBatch(accounts: string[], ids: number[]){
    return (await this.callTx<number[]>(this.contract.methods.balanceOfBatch(accounts, ids)))
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

  async getApprovalForAllEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`ApprovalForAll`, filter)
  }

  async getOwnershipTransferredEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`OwnershipTransferred`, filter)
  }

  async getTransferBatchEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`TransferBatch`, filter)
  }

  async getTransferSingleEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`TransferSingle`, filter)
  }

  async getURIEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`URI`, filter)
  }
}
