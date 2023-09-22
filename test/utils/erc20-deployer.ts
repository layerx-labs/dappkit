import {ERC20, toSmartContractDecimals, Web3Connection, type Web3ConnectionOptions} from "../../src";

/**
 * Helper to deploy ERC20 tokens
 * @param name
 * @param symbol
 * @param cap
 * @param web3Connection
 * @returns Promise<TransactionReceipt>
 */
export async function erc20Deployer(name: string, symbol: string, cap = toSmartContractDecimals(1000000, 18), web3Connection: Web3Connection|Web3ConnectionOptions, decimals = 18) {
  if (!(web3Connection instanceof Web3Connection))
    web3Connection = new Web3Connection(web3Connection)

  web3Connection.start();

  const deployer = new ERC20(web3Connection);

  return deployer.deployJsonAbi(name, symbol, cap, decimals);
}