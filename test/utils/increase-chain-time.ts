import {type JsonRpcPayload} from "web3-types/src/json_rpc_types";
import {payload} from "./json-rpc-payload";
import type Web3 from "web3";

/**
 * Advance in time by mining a block on the chain
 * @param {number} time seconds to increase
 * @param {Web3} web3 web3
 */
export async function increaseTime(time: number, web3: Web3) {

  const timeAdvance = payload(`evm_increaseTime`, [time]) as JsonRpcPayload;
  const mine = payload(`evm_mine`, []) as JsonRpcPayload;
  const provider = web3.currentProvider!;

  return new Promise((resolve, reject) => {
    provider.send(timeAdvance, (err,) => {
      if (err)
        reject(err);
      else provider.send(mine, (err, resp) => {
        if (err)
          reject(err)
        resolve(resp);
      })
    })
  });
}