import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {XEvents} from '@events/x-events';

import Network_RegistryJson from '@abi/Network_Registry.json';
import { Network_RegistryMethods } from '@methods/network-registry';
import * as Events from '@events/network-registry'
import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';

export class Network_Registry extends Model<Network_RegistryMethods> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, Network_RegistryJson.abi as AbiItem[], contractAddress);
  }

  async deployJsonAbi(_erc20: string, _lockAmountForNetworkCreation: number) {
    const deployOptions = {
      data: Network_RegistryJson.bytecode,
      arguments: [
        _erc20, _lockAmountForNetworkCreation
      ]
    }
    return this.deploy(deployOptions, this.web3Connection.Account);
  }

    async _governor() { 
    return this.callTx(this.contract.methods._governor());
  }

  async _proposedGovernor() { 
    return this.callTx(this.contract.methods._proposedGovernor());
  }

  async claimGovernor() { 
    return this.sendTx(this.contract.methods.claimGovernor());
  }

  async erc20() { 
    return this.callTx(this.contract.methods.erc20());
  }

  async lockAmountForNetworkCreation() { 
    return this.callTx(this.contract.methods.lockAmountForNetworkCreation());
  }

  async lockedTokensOfAddress(v1: string) { 
    return this.callTx(this.contract.methods.lockedTokensOfAddress(v1));
  }

  async networkOfAddress(v1: string) { 
    return this.callTx(this.contract.methods.networkOfAddress(v1));
  }

  async networksArray(v1: number) { 
    return this.callTx(this.contract.methods.networksArray(v1));
  }

  async proposeGovernor(proposedGovernor: string) { 
    return this.sendTx(this.contract.methods.proposeGovernor(proposedGovernor));
  }

  async totalLockedAmount() { 
    return this.callTx(this.contract.methods.totalLockedAmount());
  }

  async amountOfNetworks() { 
    return this.callTx(this.contract.methods.amountOfNetworks());
  }

  async lock(_amount: number) { 
    return this.sendTx(this.contract.methods.lock(_amount));
  }

  async unlock() { 
    return this.sendTx(this.contract.methods.unlock());
  }

  async registerNetwork(networkAddress: string) { 
    return this.sendTx(this.contract.methods.registerNetwork(networkAddress));
  }

  async changeAmountForNetworkCreation(newAmount: number) { 
    return this.sendTx(this.contract.methods.changeAmountForNetworkCreation(newAmount));
  }

  async getGovernorTransferredEvents(filter: PastEventOptions): Promise<XEvents<Events.GovernorTransferredEvent>[]> {
    return this.contract.self.getPastEvents('GovernorTransferred', filter);
  }
  async getNetworkClosedEvents(filter: PastEventOptions): Promise<XEvents<Events.NetworkClosedEvent>[]> {
    return this.contract.self.getPastEvents('NetworkClosed', filter);
  }
  async getNetworkCreatedEvents(filter: PastEventOptions): Promise<XEvents<Events.NetworkCreatedEvent>[]> {
    return this.contract.self.getPastEvents('NetworkCreated', filter);
  }
  async getUserLockedAmountChangedEvents(filter: PastEventOptions): Promise<XEvents<Events.UserLockedAmountChangedEvent>[]> {
    return this.contract.self.getPastEvents('UserLockedAmountChanged', filter);
  }
}