import {type TransactionReceipt} from "web3-types";
import {type Web3Connection} from "../../src";

/**
 * Agnostic model deployer to help out in the deployment of initial contracts
 * @param web3connection
 * @param _class
 * @param args
 */
export function modelExtensionDeployer(web3connection: Web3Connection, _class: any, args?: any[]): Promise<TransactionReceipt> {
  return new _class(web3connection).deployJsonAbi(...(args || []));
}