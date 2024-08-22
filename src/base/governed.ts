import {ContractEventOptions} from 'web3-eth-contract'
import artifact from '@interfaces/generated/abi/Governed';
import {Web3Connection} from "@base/web3-connection";
import {Web3ConnectionOptions} from "@interfaces/web3-connection-options";
import {Model} from "@base/model";

export class Governed extends Model<typeof artifact.abi> {
  constructor(web3Connection: Web3Connection | Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  async _governor() {
    return this.callTx(this.contract.methods._governor());
  }

  async _proposedGovernor() {
    return this.callTx(this.contract.methods._proposedGovernor());
  }

  async proposeGovernor(proposedGovernor: string) {
    return this.sendTx(this.contract.methods.proposeGovernor(proposedGovernor));
  }

  async claimGovernor() {
    return this.sendTx(this.contract.methods.claimGovernor());
  }

  async getGovernorTransferredEvents(filter: ContractEventOptions) {
    return this.contract.self.events.GovernorTransferred(filter)
  }
}
