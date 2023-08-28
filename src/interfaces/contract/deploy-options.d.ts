import type {ContractConstructorArgs, HexString} from "web3-types";
import {ContractAbi} from "web3";

export default interface DeployOptions<Abi extends ContractAbi> {
  /**
   * The byte code of the contract.
   */
  data: HexString;
  input?: HexString;
  /**
   * The arguments which get passed to the constructor on deployment.
   */
  arguments: ContractConstructorArgs<Abi>;
}