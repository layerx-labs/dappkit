import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import ERC721CollectiblesJson from '@abi/ERC721Collectibles.json';
import {ERC721CollectiblesMethods} from '@methods/erc721-collectibles';
import {AbiItem} from 'web3-utils';
import {ERC20} from '@models/erc20';
import {fromDecimals, toSmartContractDecimals,} from '@utils/numbers';

export class ERC721Collectibles extends Model<ERC721CollectiblesMethods> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions,
              contractAddress?: string,
              readonly _purchaseToken?: string) {
    super(web3Connection, ERC721CollectiblesJson.abi as AbiItem[], contractAddress);
  }

  private _erc20!: ERC20;
  get erc20() { return this._erc20; }

  async loadContract() {
    if (!this.contract)
      return;

    const contractAddress = this._purchaseToken || await this.callTx(this.contract.methods._purchaseToken());
    this._erc20 = new ERC20(this.connection, contractAddress);
    await this._erc20.start();
  }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async deployJsonAbi(name: string,
                      symbol: string,
                      limitedAmount: number,
                      _purchaseToken: string,
                      baseFeeAddress: string,
                      feeAddress: string,
                      otherAddress: string) {
    const deployOptions = {
        data: ERC721CollectiblesJson.bytecode,
        arguments: [name, symbol, limitedAmount, _purchaseToken, baseFeeAddress, feeAddress, otherAddress]
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async MAX_PURCHASE() {
    return this.callTx(this.contract.methods.MAX_PURCHASE());
  }

  async _baseFeeAddress() {
    return this.callTx(this.contract.methods._baseFeeAddress());
  }

  async _baseFeeShare() {
    return this.callTx(this.contract.methods._baseFeeShare());
  }

  async _closed() {
    return this.callTx(this.contract.methods._closed());
  }

  async _currentTokenId() {
    return +(await this.callTx(this.contract.methods._currentTokenId()))
  }

  async _feeAddress() {
    return this.callTx(this.contract.methods._feeAddress());
  }

  async _feeShare() {
    return this.callTx(this.contract.methods._feeShare());
  }

  async _limitedAmount() {
    return this.callTx(this.contract.methods._limitedAmount());
  }

  async _otherAddress() {
    return this.callTx(this.contract.methods._otherAddress());
  }

  async _otherShare() {
    return this.callTx(this.contract.methods._otherShare());
  }

  async isLimited() {
    return this.callTx(this.contract.methods._isLimited());
  }

  async openedPacks() {
    return +(await this.callTx(this.contract.methods._openedPacks()));
  }

  async pricePerPack() {
    return fromDecimals(await this.callTx(this.contract.methods._pricePerPack()), this.erc20.decimals);
  }

  async purchaseToken() {
    return this.callTx(this.contract.methods._purchaseToken());
  }

  async alreadyMinted(v1: number) {
    return this.callTx(this.contract.methods.alreadyMinted(v1));
  }

  async approveERC20Transfer() {
    return this.erc20.approve(this.contractAddress!, await this.erc20.totalSupply());
  }

  async isApproved(amount: number) {
    return this.erc20.isApproved(this.contractAddress!, amount)
  }

  async balanceOf(owner: string) {
    return this.callTx(this.contract.methods.balanceOf(owner));
  }

  async baseURI() {
    return this.callTx(this.contract.methods.baseURI());
  }

  async approve(to: string, tokenId: number) {
    return this.sendTx(this.contract.methods.approve(to, tokenId));
  }

  async getApproved(tokenId: number) {
    return this.callTx(this.contract.methods.getApproved(tokenId));
  }

  async isApprovedForAll(owner: string, operator: string) {
    return this.callTx(this.contract.methods.isApprovedForAll(owner, operator));
  }

  async lock() {
    return this.sendTx(this.contract.methods.lock());
  }

  async name() {
    return this.callTx(this.contract.methods.name());
  }

  async owner() {
    return this.callTx(this.contract.methods.owner());
  }

  async ownerOf(tokenId: number) {
    return this.callTx(this.contract.methods.ownerOf(tokenId));
  }

  async registeredIDs(address: string, tokenId: number) {
    return this.callTx(this.contract.methods.registeredIDs(address, tokenId));
  }

  async registeredIDsArray(v1: string, v2: number) {
    return this.callTx(this.contract.methods.registeredIDsArray(v1, v2));
  }

  async safeTransferFrom(from: string, to: string, tokenId: number, _data?: string) {
    return this.sendTx(this.contract.methods.safeTransferFrom(from, to, tokenId, _data));
  }

  async setApprovalForAll(operator: string, approved: boolean) {
    return this.sendTx(this.contract.methods.setApprovalForAll(operator, approved));
  }

  async setFeeAddress(feeAddress: string) {
    return this.sendTx(this.contract.methods.setFeeAddress(feeAddress));
  }

  async setOtherAddress(otherAddress: string) {
    return this.sendTx(this.contract.methods.setOtherAddress(otherAddress));
  }

  async setPricePerPack(newPrice: string | number) {
    newPrice = toSmartContractDecimals(newPrice, this.erc20.decimals);
    return this.sendTx(this.contract.methods.setPricePerPack(newPrice));
  }

  async setPurchaseTokenAddress(purchaseToken: string) {
    return this.sendTx(this.contract.methods.setPurchaseTokenAddress(purchaseToken));
  }

  async setShares(feeShare: number, otherShare: number) {
    return this.sendTx(this.contract.methods.setShares(feeShare, otherShare));
  }

  async supportsInterface(interfaceId: string) {
    return this.callTx(this.contract.methods.supportsInterface(interfaceId));
  }

  async symbol() {
    return this.callTx(this.contract.methods.symbol());
  }

  async tokenByIndex(index: number) {
    return this.callTx(this.contract.methods.tokenByIndex(index));
  }

  async tokenOfOwnerByIndex(owner: string, index: number) {
    return this.callTx(this.contract.methods.tokenOfOwnerByIndex(owner, index));
  }

  async tokenURI(tokenId: number) {
    return this.callTx(this.contract.methods.tokenURI(tokenId));
  }

  async totalSupply() {
    return this.callTx(this.contract.methods.totalSupply());
  }

  async transferFrom(from: string, to: string, tokenId: number) {
    return this.sendTx(this.contract.methods.transferFrom(from, to, tokenId));
  }

  async transferOwnership(newOwner: string) {
    return this.sendTx(this.contract.methods.transferOwnership(newOwner));
  }

  async unlock() {
    return this.sendTx(this.contract.methods.unlock());
  }

  async exists(tokenId: number) {
    return this.callTx(this.contract.methods.exists(tokenId));
  }

  async setTokenURI(tokenId: number, uri: string) {
    return this.sendTx(this.contract.methods.setTokenURI(tokenId, uri));
  }

  async setBaseURI(baseURI: string) {
    return this.sendTx(this.contract.methods.setBaseURI(baseURI));
  }

  async mint(tokenIdToMint: number) {
    return this.sendTx(this.contract.methods.mint(tokenIdToMint));
  }

  async openPack(amount: number) {
    return this.sendTx(this.contract.methods.openPack(amount));
  }

  async getRegisteredIDs(_address: string) {
    return (await this.callTx(this.contract.methods.getRegisteredIDs(_address)))?.map(id => +id);
  }

}
