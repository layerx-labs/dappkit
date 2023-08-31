import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {IsOwnable} from '@interfaces/modifiers';
import {ERC20} from '@models/token/ERC20/erc20';
import {Ownable} from '@base/ownable';
import {toSmartContractDate, toSmartContractDecimals} from '@utils/numbers';
import artifact from "@interfaces/generated/abi/ERC20Distribution";
import {ContractConstructorArgs} from "web3-types/lib/types";

export class ERC20Distribution extends Model<typeof artifact.abi> implements Deployable, IsOwnable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  private _erc20!: ERC20;
  get erc20() { return this._erc20; }

  private _ownable!: Ownable;

  get ownable() { return this._ownable }

  async start() {
    await super.start();

    if (this.contract) {
      this._ownable = new Ownable(this.connection, this.contractAddress);

      this._erc20 = new ERC20(this.connection, await this.callTx(this.contract.methods.erc20()));
      await this._erc20.start();
    }
  }

  async deployJsonAbi() {
    const deployOptions = {
      data: artifact.bytecode,
      arguments: [] as ContractConstructorArgs<typeof artifact.abi>
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async TGEDate() {
    return this.callTx(this.contract.methods.TGEDate());
  }

  async decimals() {
    return this.callTx(this.contract.methods.decimals());
  }

  async distributions(v1: string, v2: number) {
    return this.callTx(this.contract.methods.distributions(v1, v2));
  }

  async erc20Address() {
    return this.callTx(this.contract.methods.erc20());
  }

  async lastDateDistribution() {
    return this.callTx(this.contract.methods.lastDateDistribution());
  }

  async month() {
    return this.callTx(this.contract.methods.month());
  }

  async tokenOwners(v1: number) {
    return this.callTx(this.contract.methods.tokenOwners(v1));
  }

  async transferOwnership(newOwner: string) {
    return this.sendTx(this.contract.methods.transferOwnership(newOwner));
  }

  async year() {
    return this.callTx(this.contract.methods.year());
  }

  async setTokenAddress(_tokenAddress: string) {
    return this.sendTx(this.contract.methods.setTokenAddress(_tokenAddress));
  }

  async safeGuardAllTokens(_address: string) {
    return this.sendTx(this.contract.methods.safeGuardAllTokens(_address));
  }

  async setTGEDate(_time: number) {
    return this.sendTx(this.contract.methods.setTGEDate(toSmartContractDate(_time)));
  }

  async triggerTokenSend() {
    return this.sendTx(this.contract.methods.triggerTokenSend());
  }

  async setInitialDistribution(_address: string, _tokenAmount: number, _unlockDays: number) {
    return this.sendTx(this.contract.methods
                           .setInitialDistribution(_address,
                                                   toSmartContractDecimals(_tokenAmount, this.erc20.decimals),
                                                   toSmartContractDate(_unlockDays)));
  }

}
