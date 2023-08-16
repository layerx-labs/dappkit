import {UseModel} from '@base/use-model';
import {XEvents} from '@events/x-events';
import * as Events from '@events/governed-events';
import governed from '@abi/contracts/utils/Governed.sol/Governed.json'

export class Governed extends UseModel<governed.abi> {
  async _governor() {
    return this.model.callTx(this.model.contract.methods._governor());
  }

  async _proposedGovernor() {
    return this.model.callTx(this.model.contract.methods._proposedGovernor());
  }

  async proposeGovernor(proposedGovernor: string) {
    return this.model.sendTx(this.model.contract.methods.proposeGovernor(proposedGovernor));
  }

  async claimGovernor() {
    return this.model.sendTx(this.model.contract.methods.claimGovernor());
  }

  async getGovernorTransferredEvents(filter: PastEventOptions): Promise<XEvents<Events.GovernorTransferredEvent>[]> {
    return this.model.contract.self.getPastEvents(`GovernorTransferred`, filter)
  }
}
