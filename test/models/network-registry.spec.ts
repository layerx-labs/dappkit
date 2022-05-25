import {
  ERC20,
  Network_V2,
  BountyToken,
  Web3Connection,
  NetworkRegistry,
  toSmartContractDecimals
} from '../../src';
import {shouldBeRejected, defaultWeb3Connection, modelExtensionDeployer, erc20Deployer, hasTxBlockNumber} from '../utils/';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import { nativeZeroAddress } from '../../src/utils/constants';

describe(`NetworkRegistry`, () => {
  let web3Connection: Web3Connection;

  let registryAddress: string;
  let networkAddress: string;
  let erc20Address: string;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
    const erc20 = await erc20Deployer('Name', '$symbol', toSmartContractDecimals(1000000), web3Connection);
    const nftToken = await modelExtensionDeployer(web3Connection, BountyToken, ['Name', 'Symbol']);
    const receipt =
      await modelExtensionDeployer(
        web3Connection,
        Network_V2,
        [erc20.contractAddress, nftToken.contractAddress, '//', nativeZeroAddress, 0, 0]);

    networkAddress = receipt.contractAddress;
    erc20Address = erc20.contractAddress;
  });

  it(`Deploys`, async () => {
    const registry = new NetworkRegistry(web3Connection);
    const receipt = await registry.deployJsonAbi(erc20Address, 1000);
    expect(receipt.contractAddress, "Should have deployed");
    registryAddress = receipt.contractAddress;
  });

  describe(`Integration`, () => {
    let registry: NetworkRegistry;

    before(async () => {
      registry = new NetworkRegistry(web3Connection, registryAddress);
      await registry.start();
    });

    describe(`Throws`, () => {
      it(`because no locked amount`, async () => {
        await shouldBeRejected(registry.registerNetwork(networkAddress), "R1");
      });

      it(`because trying to lock 0`, async () => {
        await shouldBeRejected(registry.lock(0), "L0");
      });

      it(`because not allowed`, async () => {
        await shouldBeRejected(registry.lock(1), "L1");
      });

      it(`because no tokens to unlock`, async () => {
        await shouldBeRejected(registry.unlock(), "UL0");
      });
    });

    describe(`Green Path`, () => {
      it(`Changes amount needed for network creation`, async () => {
        await hasTxBlockNumber(registry.changeAmountForNetworkCreation(10));
      });

      it(`Approves, Locks and Unlocks`, async () => {
        const erc20 = new ERC20(web3Connection, erc20Address);
        await hasTxBlockNumber(erc20.approve(registryAddress, 10));
        await hasTxBlockNumber(registry.lock(10));
        await hasTxBlockNumber(registry.unlock());
      });

      it(`Locks`, async () => {
        await hasTxBlockNumber(registry.lock(10));
      });

      it(`Adds the network to the registry`, async () => {
        const receipt = await registry.registerNetwork(networkAddress);
        expect(receipt.transactionHash).to.exist;
        expect(await registry.getNetworkCreatedEvents({fromBlock: receipt.blockNumber})).to.have.lengthOf(1);
      });

      it(`Throws because one networks per user`, async () => {
        await shouldBeRejected(registry.registerNetwork(networkAddress), "R0");
      });

      it(`Unlocks and turns off network`, async () => {
        const receipt = await registry.unlock();
        expect(receipt.transactionHash).to.exist;
        expect(await registry.getNetworkClosedEvents({fromBlock: receipt.blockNumber})).to.have.lengthOf(1);
      });

    });
  })

});