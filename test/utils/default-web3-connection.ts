import {revertChain} from "./index";
import {Web3Connection, type Web3ConnectionOptions} from "../../src";
import {getPrivateKeyFromFile} from "./get-pvt-k-from-file";

/**
 * A helper function to start a web3connection from process.env files
 * @param start
 * @param revert
 */
export async function defaultWeb3Connection(start = false, revert = false) {
  const options: Web3ConnectionOptions = {
    web3Host: process.env.CI_WEB3_HOST_PROVIDER || 'HTTP://127.0.0.1:8545',
    privateKey: getPrivateKeyFromFile(),
    skipWindowAssignment: true,
    restartModelOnDeploy: false,
  }

  const web3Connection = new Web3Connection(options);
  if (start)
    await web3Connection.start();
  if (revert)
    await revertChain(web3Connection.Web3);

  web3Connection.eth.contractDataInputFill = "both";

  return web3Connection;
}