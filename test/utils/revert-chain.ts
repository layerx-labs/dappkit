import {type JsonRpcPayload} from "web3-types/src/json_rpc_types";
import type Web3 from "web3";
import {payload} from "./json-rpc-payload";

/**
 * Revert the chain to its default state
 * @param web3
 */
export async function revertChain(web3: Web3) {
  return new Promise((resolve, reject) => {
    web3.currentProvider!
      .send(payload(`evm_revert`, []) as JsonRpcPayload,
        (err, resp) => {
          if (err)
            reject(err)
          resolve(resp);
        })
  })
}