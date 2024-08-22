
import {Errors} from '@interfaces/error-enum';
import artifact from "@interfaces/generated/abi/Ownable";
import {Model} from "@base/model";
import {Web3Connection} from "@base/web3-connection";
import {Web3ConnectionOptions} from "@interfaces/web3-connection-options";

export class Ownable extends Model<typeof artifact.abi> {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  async setOwner(address: string) {
    return this.sendTx(this.contract.methods.transferOwnership(address))
  }

  async owner(): Promise<string> {
    return this.callTx(this.contract.methods.owner());
  }

  async onlyOwner() {
    const isOwner = (await this.owner()) === (await this.connection.getAddress());
    if (!isOwner)
      throw new Error(Errors.OnlyAdminCanPerformThisOperation)
  }
}
