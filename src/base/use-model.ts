import {Model} from '@base/model';

export type NeedsFromModel = 'sendTx' | 'sendUnsignedTx' | 'callTx' | 'contract' | 'connection' | 'account';

export type UseModelParams<ModelMethods = any> =
  Pick<Model<ModelMethods>, NeedsFromModel>

export type MinimalModel = Pick<Model, NeedsFromModel>;

export class UseModel<ModelMethods = any> {
  readonly model!: MinimalModel;

  constructor({sendTx, sendUnsignedTx, callTx, contract, connection, account}: UseModelParams<ModelMethods>) {
    this.model = {sendTx, sendUnsignedTx, callTx, contract, connection, account}
  }
}
