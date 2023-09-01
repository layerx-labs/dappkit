import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {nativeZeroAddress} from "@utils/constants";
import artifact from "@interfaces/generated/abi/BountyToken";
import {ContractConstructorArgs} from "web3-types/lib/types";
import {Filter} from "web3";

type BountyTokenConnector = {originNetwork: string; bountyId: number; percentage: number; kind: string};

export class BountyToken extends Model<typeof artifact.abi> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  async deployJsonAbi(name_: string, symbol_: string, dispatcher_: string = nativeZeroAddress) {
    const deployOptions = {
        data: artifact.bytecode,
        arguments: [name_, symbol_, dispatcher_] as ContractConstructorArgs<typeof artifact.abi>
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async _governor() {
    return this.callTx(this.contract.methods._governor());
  }

  async _proposedGovernor() {
    return this.callTx(this.contract.methods._proposedGovernor());
  }

  async dispatcher() {
    return this.callTx(this.contract.methods.dispatcher());
  }

  async setDispatcher(dispatcher: string) {
    return this.sendTx(this.contract.methods.setDispatcher(dispatcher));
  }

  /**
   * See {IERC721-approve}.
   */
  async approve(to: string, tokenId: number) {
    return this.callTx(this.contract.methods.approve(to, tokenId));
  }

  /**
   * See {IERC721-balanceOf}.
   */
  async balanceOf(owner: string) {
    return this.callTx(this.contract.methods.balanceOf(owner));
  }

  /**
   * Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.
   */
  async baseURI() {
    return this.callTx(this.contract.methods.baseURI());
  }

  async claimGovernor() {
    return this.callTx(this.contract.methods.claimGovernor());
  }

  /**
   * See {IERC721-getApproved}.
   */
  async getApproved(tokenId: number) {
    return this.callTx(this.contract.methods.getApproved(tokenId));
  }

  /**
   * See {IERC721-isApprovedForAll}.
   */
  async isApprovedForAll(owner: string, operator: string) {
    return this.callTx(this.contract.methods.isApprovedForAll(owner, operator));
  }

  /**
   * See {IERC721Metadata-name}.
   */
  async name() {
    return this.callTx(this.contract.methods.name());
  }

  /**
   * See {IERC721-ownerOf}.
   */
  async ownerOf(tokenId: number) {
    return this.callTx(this.contract.methods.ownerOf(tokenId));
  }

  async proposeGovernor(proposedGovernor: string) {
    return this.callTx(this.contract.methods.proposeGovernor(proposedGovernor));
  }

  /**
   * See {IERC721-safeTransferFrom}.
   */
  async safeTransferFrom(from: string, to: string, tokenId: number, _data = "0x0") {
    return this.callTx(this.contract.methods.safeTransferFrom(from, to, tokenId, _data));
  }

  /**
   * See {IERC721-setApprovalForAll}.
   */
  async setApprovalForAll(operator: string, approved: boolean) {
    return this.callTx(this.contract.methods.setApprovalForAll(operator, approved));
  }

  /**
   * See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.
   */
  async supportsInterface(interfaceId: string) {
    return this.callTx(this.contract.methods.supportsInterface(interfaceId));
  }

  /**
   * See {IERC721Metadata-symbol}.
   */
  async symbol() {
    return this.callTx(this.contract.methods.symbol());
  }

  /**
   * See {IERC721Enumerable-tokenByIndex}.
   */
  async tokenByIndex(index: number) {
    return this.callTx(this.contract.methods.tokenByIndex(index));
  }

  /**
   * See {IERC721Enumerable-tokenOfOwnerByIndex}.
   */
  async tokenOfOwnerByIndex(owner: string, index: number) {
    return this.callTx(this.contract.methods.tokenOfOwnerByIndex(owner, index));
  }

  /**
   * See {IERC721Metadata-tokenURI}.
   */
  async tokenURI(tokenId: number) {
    return this.callTx(this.contract.methods.tokenURI(tokenId));
  }

  /**
   * See {IERC721Enumerable-totalSupply}.
   */
  async totalSupply() {
    return this.callTx(this.contract.methods.totalSupply());
  }

  /**
   * See {IERC721-transferFrom}.
   */
  async transferFrom(from: string, to: string, tokenId: number) {
    return this.callTx(this.contract.methods.transferFrom(from, to, tokenId));
  }

  async awardBounty(to: string, uri: string, options: BountyTokenConnector) {
    return this.sendTx(this.contract.methods.awardBounty(to, uri, options));
  }

  async getBountyToken(id: number) {
    return this.callTx(this.contract.methods.getBountyToken(id));
  }

  async getApprovalEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`Approval`, filter)
  }

  async getApprovalForAllEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`ApprovalForAll`, filter)
  }

  async getGovernorTransferredEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`GovernorTransferred`, filter)
  }

  async getTransferEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`Transfer`, filter)
  }

}