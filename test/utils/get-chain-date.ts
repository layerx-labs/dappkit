import {type Web3Connection} from "../../src";

/**
 * Return chain date
 * @param web3Connection
 * @returns Date
 */
export async function getChainDate(web3Connection: Web3Connection) {
  return new Date(parseInt((await web3Connection.eth.getBlock(await web3Connection.Web3.eth.getBlockNumber())).timestamp.toString(),10) * 1000)
}