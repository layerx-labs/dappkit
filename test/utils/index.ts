import {Web3ConnectionOptions, Web3Connection, ERC20, toSmartContractDecimals} from '../../src';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {expect} from 'chai';
import Web3 from 'web3';
import {HttpProvider, WebsocketProvider} from 'web3-core';
import {TransactionReceipt} from 'web3-eth';

/**
 * Returns the private key from the output provided by ganache
 * @param index
 */
export function getPrivateKeyFromFile(index = 0) {
  return Object.values(JSON.parse(readFileSync(resolve('./keys.json'), 'utf-8')).private_keys)[index] as string;
}

/**
 * A helper function to start a web3connection from process.env files
 * @param start
 * @param revert
 */
export async function defaultWeb3Connection(start = false, revert = false) {
  const options: Web3ConnectionOptions = {
    web3Host: process.env.WEB3_HOST_PROVIDER || 'HTTP://127.0.0.1:8545',
    privateKey: process.env.WALLET_PRIVATE_KEY || getPrivateKeyFromFile(),
    skipWindowAssignment: true
  }

  const web3Connection = new Web3Connection(options);
  if (start)
    await web3Connection.start();
  if (revert)
    await revertChain(web3Connection.Web3);

  return web3Connection;
}

/**
 * Helper to deploy ERC20 tokens
 * @param name
 * @param symbol
 * @param cap
 * @param web3Connection
 * @returns Promise<TransactionReceipt>
 */
export async function erc20Deployer(name: string, symbol: string, cap = toSmartContractDecimals(1000000, 18), web3Connection: Web3Connection|Web3ConnectionOptions) {
  if (!(web3Connection instanceof Web3Connection))
    web3Connection = new Web3Connection(web3Connection)

  await web3Connection.start();

  const deployer = new ERC20(web3Connection);
  await deployer.loadAbi();

  const address = await deployer.connection.getAddress();
  return deployer.deployJsonAbi(name, symbol, cap, address);
}

/**
 * Create a new account and return it
 * @param web3Connection
 * @param salt
 */
export function newWeb3Account(web3Connection: Web3Connection, salt = `0xB3pR0Te511Ng`) {
  return web3Connection.Web3.eth.accounts.create(salt);
}

/**
 * Helper to assert that the promise needs to be rejected
 * @param promise
 * @param withErrorMessage
 */
export async function shouldBeRejected(promise: Promise<any>, withErrorMessage?: string) {
  try {
    await promise;
    expect(`to have failed`).to.not.exist;
  } catch (e: any) {
    if (withErrorMessage)
      expect(e?.message).to.contain(withErrorMessage);
    else expect(e).to.exist;
  }
}

const payload = (method: string, params: any[] = []) => ({jsonrpc: `2.0`, method, params, id: 0});

/**
 * Advance in time by mining a block on the chain
 * @param {number} time seconds to increase
 * @param {Web3} web3 web3
 */
export async function increaseTime(time: number, web3: Web3) {

  const timeAdvance = payload(`evm_increaseTime`, [time]);
  const mine = payload(`evm_mine`, []);
  const provider = (web3.currentProvider as HttpProvider|WebsocketProvider);

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

/**
 * Revert the chain to its default state
 * @param web3
 */
export async function revertChain(web3: Web3) {
  return new Promise((resolve, reject) => {
    (web3.currentProvider as HttpProvider|WebsocketProvider)
      .send(payload(`evm_revert`, []),
            (err, resp) => {
              if (err)
                reject(err)
              resolve(resp);
            })
  })
}

/**
 * Assert that the promise returns a block number
 * @param promise
 * @param message
 */
export async function hasTxBlockNumber(promise: Promise<any>, message = `Should have blockNumber`) {
    const tx = await promise.catch(e => {
      // console.error(e);
      expect(e?.data?.reason || e?.data?.message || e?.message || `Should not have been rejected`).to.be.empty;
    });
    expect(tx, message).property('blockNumber').to.exist;
}

export function calculateAPR(apr = 1, start = 0,
                                   end = 0, amount = 1) {
  const timePassed = +end-+start;
  const ms = 60;
  return ((((apr / 365 / 24 / ms) * timePassed) / ms) * amount) / 100;
}

/**
 * Return chain date
 * @param web3Connection
 * @returns Date
 */
export async function getChainDate(web3Connection: Web3Connection) {
  return new Date(+(await web3Connection.eth.getBlock(await web3Connection.Web3.eth.getBlockNumber())).timestamp * 1000)
}

export function outputDeploy(info: [string, string][] = []) {
  if (!process.env.DEBUG_TESTS)
    return;

  console.log(`Deployed`, info.map(([name, address]) => `\n\t${name}:\t${address}`).join(``))
}

/**
 * Agnostic model deployer to help out in the deployment of initial contracts
 * @param web3connection
 * @param _class
 * @param args
 */
export function modelExtensionDeployer(web3connection: Web3Connection, _class: any, args?: any[]): Promise<TransactionReceipt> {
  const deployer = new _class(web3connection);
  deployer.loadAbi();
  return deployer.deployJsonAbi(...(args || []));
}
