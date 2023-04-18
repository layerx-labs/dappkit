import {Model} from '@base/model';
import {ERC721StandardMethods} from '@methods/erc721-standard';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import ERC721Standard from '@abi/ERC721Standard.json';
import {AbiItem} from 'web3-utils';
import {Deployable} from '@interfaces/deployable';
import {TransactionReceipt} from "@interfaces/web3-core";

export class Erc721Standard extends Model<ERC721StandardMethods> implements Deployable {

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, ERC721Standard.abi as AbiItem[], contractAddress);
  }

  async exists(tokenId: number) {
    return this.callTx(this.contract.methods.exists(tokenId));
  }

  async setBaseURI(baseURI: string) {
    return this.sendTx(this.contract.methods.setBaseURI(baseURI));
  }

  async setTokenURI(tokenId: number, uri: string) {
    return this.sendTx(this.contract.methods.setTokenURI(tokenId, uri));
  }

  async mint(to: string, tokenId: number, data: string = "0x0") {
    return this.sendTx(this.contract.methods.mint(to, tokenId, data))
  }

  async totalSupply() {
    return this.callTx(this.contract.methods.totalSupply())
  }

  async approve(address: string, tokenId: number): Promise<TransactionReceipt> {
    return this.sendTx(this.contract.methods.approve(address, tokenId));
  }

  async getApproved(tokenId: number) {
    return this.callTx(this.contract.methods.getApproved(tokenId));
  }

  async isApprovedForAll(owner:string, operator: string) {
    return this.callTx(this.contract.methods.isApprovedForAll(owner, operator));
  }

  async setApprovalForAll(owner:string, approved: boolean) {
    return this.sendTx(this.contract.methods.setApprovalForAll(owner, approved));
  }

  async balanceOf(address: string): Promise<TransactionReceipt> {
    return this.sendTx(this.contract.methods.balanceOf(address));
  }

  async safeTransferFrom(from: string, to: string, tokenId: number, data = "0x0") {
    return this.sendTx(this.contract.methods.safeTransferFrom(from, to, tokenId, data))
  }

  async transferFrom(from: string, to: string, tokenId: number) {
    return this.sendTx(this.contract.methods.safeTransferFrom(from, to, tokenId))
  }

  async transferOwnership(newOwner: string) {
    return this.sendTx(this.contract.methods.transferOwnership(newOwner))
  }

  async supportsInterface(interfaceId: string) {
    return this.callTx(this.contract.methods.supportsInterface(interfaceId))
  }

  async symbol() {
    return this.callTx(this.contract.methods.symbol())
  }

  async name() {
    return this.callTx(this.contract.methods.name())
  }

  async owner() {
    return this.callTx(this.contract.methods.owner())
  }

  async ownerOf(tokenId: number) {
    return this.callTx(this.contract.methods.ownerOf(tokenId))
  }

  async tokenByIndex(index: number) {
    return this.callTx(this.contract.methods.tokenByIndex(index))
  }

  async tokenOfOwnerByIndex(owner: string, index: number) {
    return this.callTx(this.contract.methods.tokenOfOwnerByIndex(owner, index))
  }

  async deployJsonAbi(name: string, symbol: string) {
    const options = {
      data: ERC721Standard.bytecode,
      arguments: [name, symbol]
    }

    return this.deploy(options, this.connection.Account);
  }
}
