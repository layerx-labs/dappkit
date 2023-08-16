import {Model} from '@base/model';
import {AbiFragment} from "web3-types/src/eth_abi_types";

export type NeedsFromModel = 'sendTx' | 'sendUnsignedTx' | 'callTx' | 'contract' | 'connection';

export type UseModelParams<ModelMethods extends AbiFragment[]> =
  Pick<Model<ModelMethods>, NeedsFromModel>

export type MinimalModel = Pick<Model, NeedsFromModel>;

export class UseModel<ModelMethods extends AbiFragment[]> {
  readonly model!: MinimalModel;

  constructor({sendTx, sendUnsignedTx, callTx, contract, connection}: UseModelParams<ModelMethods>) {
    this.model = {sendTx, sendUnsignedTx, callTx, contract, connection}
  }
}
