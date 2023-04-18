import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import RealFevrMarketplaceJson from '@abi/RealFevrMarketplace.json';
import {RealFevrMarketplaceMethods} from '@methods/real-fevr-marketplace';
import {AbiItem} from 'web3-utils';
import {Errors} from '@interfaces/error-enum';
import {ERC20} from '@models/erc20';
import {RealFevrOpener} from '@models/real-fevr-opener';
import {toSmartContractDecimals} from '@utils/numbers';
import {nativeZeroAddress} from '@utils/constants';

export class RealFevrMarketplace extends Model<RealFevrMarketplaceMethods> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions,
              contractAddress?: string,
              readonly collectiblesAddress?: string,
              readonly tokenAddress?: string) {
    super(web3Connection, RealFevrMarketplaceJson.abi as AbiItem[], contractAddress);
  }

  get isETHTransaction() { return this.tokenAddress === nativeZeroAddress; }

  private _decimals = 18;
  get decimals(): number { return this._decimals; }

  private _erc20!: ERC20;
  get erc20() { return this._erc20; }

  private _opener!: RealFevrOpener;
  get opener() { return this._opener; }

  /* eslint-disable complexity */
  async start() {
    await super.start();

    if (!this.contractAddress)
      return;

    const tokenAddress = await this.getERC20TokenAddress();
    if (!tokenAddress)
      throw new Error(Errors.MissingERC20AddressOnContract);

    const collectiblesAddress = await this.getERC721TokenAddress();
    if (!collectiblesAddress)
      throw new Error(Errors.MissingERC721AddressOnContract);

    if (tokenAddress !== nativeZeroAddress) {
      // Set Token Address Contract for easy access
      this._erc20 = new ERC20(this.connection, tokenAddress);
      await this._erc20.start();
      this._decimals = this._erc20.decimals;
    }

    this._opener = new RealFevrOpener(this.connection, collectiblesAddress);
    await this._opener.start();
  }
  /* eslint-enable complexity */

  /**
   * The marketplace can be deployed on a native-transactions mode; simply assign tokenAddress to
   * the null wallet '0x0000000000000000000000000000000000000000', and all transactions will be
   * resolved via the chain's native token.
   */
  async deployJsonAbi(collectiblesAddress: string, tokenAddress: string) {
    const deployOptions = {
      data: RealFevrMarketplaceJson.bytecode,
      arguments: [tokenAddress, collectiblesAddress]
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async putERC721OnSale(tokenId: number, price: number) {
    const valueWithDecimals = toSmartContractDecimals(price, this.decimals);
    return this.sendTx(this.contract.methods.putERC721OnSale(tokenId, valueWithDecimals));
  }

  async removeERC721FromSale(tokenId: number) {
    return this.sendTx(this.contract.methods.removeERC721FromSale(tokenId));
  }

  async buyERC721(tokenId: number, value = 0) {
    const valueWithDecimals = toSmartContractDecimals(value, this.decimals);
    return this.sendTx(this.contract.methods.buyERC721(tokenId), valueWithDecimals);
  }

  async changeERC20(erc20TokenAddress: string) {
    return this.sendTx(this.contract.methods.changeERC20(erc20TokenAddress));
  }

  async changeERC721(openerTokenAddress: string) {
    return this.sendTx(this.contract.methods.changeERC721(openerTokenAddress));
  }

  async setFixedFees(feeAddress: string, feePercentage: number) {
    return this.sendTx(this.contract.methods.setFixedFees(feeAddress, feePercentage));
  }

  async getERC20TokenAddress() {
    if (this.tokenAddress)
      return this.tokenAddress;
    return this.callTx(this.contract.methods.erc20Address());
  }

  async getERC721TokenAddress() {
    if (this.collectiblesAddress)
      return this.collectiblesAddress;
    return this.callTx(this.contract.methods.erc721Address());
  }

  async getFeeAddress() {
    return this.callTx(this.contract.methods.feeAddress());
  }

  async getAmountofNFTsEverInSale() {
    return parseInt(await this.callTx(this.contract.methods.saleIncrementId()) as unknown as string, 10) - 1;
  }

  async approveERC721use(operator: string, approved = true) {
    return this.opener.setApprovalForAll(operator, approved);
  }
}
