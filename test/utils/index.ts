import {expect, use} from 'chai';

import {Log} from "../../src/interfaces/web3-core";
import like from 'chai-like';
import things from 'chai-things';


use(like);
use(things);

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
    // console.log(`E`, e);
    if (withErrorMessage)
      expect((e?.innerError?.message || e?.message)).to.contain(withErrorMessage);
    else expect(e).to.exist;
  }
}

/**
 * Assert that the promise returns a block number
 * @param promise
 * @param message
 */
export async function hasTxBlockNumber(promise: Promise<any>, message = `Should have blockNumber`) {
    const tx = await promise.catch(e => {
      console.log(e);
      expect(e?.data?.reason || e?.data?.message || e?.message || `Should not have been rejected`, message).to.be.empty;
    });

    expect(tx, message).property('blockNumber').to.exist;

    return tx;
}

/**
 * Assert that the transaction from the promivent has the needed decoded args and event name
 */
export async function expectEvent<T = any>(promise: Promise<T>, eventName: string, params?: {[k: string]: any}) {
  const tx = await hasTxBlockNumber(promise);
  expect(tx.logs, `Should have logs array`).to.exist;

  expect(tx.logs).to.be.an('array').that.contains.something.like({event: eventName});

  if (params)
    expect(tx.logs.map((l: Log) => l.args)).to.be.an('array').that.contains.something.like(params);
}

export {getPrivateKeyFromFile} from "./get-pvt-k-from-file";
export {defaultWeb3Connection} from "./default-web3-connection";
export {erc20Deployer} from "./erc20-deployer";
export {increaseTime} from "./increase-chain-time";
export {revertChain} from "./revert-chain";
export {getChainDate} from "./get-chain-date";
export {modelExtensionDeployer} from "./model-deployer";