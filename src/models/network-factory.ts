import {Model} from '@base/model';
import {Deployable} from '@interfaces/deployable';
import {TransactionReceipt} from '@interfaces/web3-core';
import {Web3Connection} from '@base/web3-connection';
import {ERC20} from '@models/erc20';
import {fromDecimals, toSmartContractDecimals} from '@utils/numbers';
import {Errors} from '@interfaces/error-enum';
import artifact from "@interfaces/generated/abi/NetworkFactory";
import {ContractConstructorArgs} from "web3-types";

export class NetworkFactory extends Model<typeof artifact.abi> implements Deployable {
  private _erc20!: ERC20;
  get erc20() { return this._erc20; }

  constructor(web3Connection: Web3Connection, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  async getNetworkByAddress(address: string) {
    return this.contract.methods.getNetworkByAddress(address).call();
  }

  async getNetworkById(id: number) {
    return this.callTx(this.contract.methods.getNetworkById(id))
  }

  async getAmountOfNetworksForked() {
    return Number(await this.callTx<bigint>(this.contract.methods.networksAmount()));
  }

  async getBEPROLocked() {
    return fromDecimals(await this.callTx(this.contract.methods.tokensLockedTotal()), this.erc20.decimals)
  }

  async getLockedStakedByAddress(address: string) {
    return fromDecimals(await this.callTx(this.contract.methods.tokensLocked(address)), this.erc20.decimals);
  }

  async OPERATOR_AMOUNT() {
    return fromDecimals(await this.callTx(this.contract.methods.OPERATOR_AMOUNT()), this.erc20.decimals);
  }

  async isOperator(address: string) {
    return await this.getLockedStakedByAddress(address) >= await this.OPERATOR_AMOUNT()
  }

  async approveSettlerERC20Token() {
    return this.erc20.approve(this.contractAddress!, await this.erc20.totalSupply())
  }

  async isApprovedSettlerToken(address: string = this.contractAddress!, amount: number) {
    return this.erc20.isApproved(address, amount)
  }

  async getSettlerTokenAddress() {
    return this.callTx<string>(this.contract.methods.beproAddress());
  }

  async lock(amount: string | number) {
    if (amount <= 0)
      throw new Error(Errors.AmountNeedsToBeHigherThanZero);

    return this.sendTx(this.contract.methods.lock(toSmartContractDecimals(amount, this.erc20.decimals)))
  }

  async unlock() {
    return this.sendTx(this.contract.methods.unlock());
  }

  async createNetwork(erc20: string, transactionalToken: string) {
    return this.sendTx(this.contract.methods.createNetwork(erc20, transactionalToken));
  }

  async start() {
    await super.start();

    if (!this.contract)
      return;

    this._erc20 = new ERC20(this.connection, await this.getSettlerTokenAddress());
    await this._erc20.start();
  }

  deployJsonAbi(erc20ContractAddress: string): Promise<TransactionReceipt> {
    const deployOptions = {
      data: artifact.bytecode,
      arguments: [erc20ContractAddress] as ContractConstructorArgs< typeof artifact.abi >
    }

    return this.deploy(deployOptions, this.connection.Account);
  }
}
