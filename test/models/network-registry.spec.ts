import {
  Network_v2,
  Web3Connection,
  Network_Registry,
  toSmartContractDecimals
} from '../../src';
import {
  shouldBeRejected,
  defaultWeb3Connection,
  modelExtensionDeployer,
  erc20Deployer,
  hasTxBlockNumber
} from '../utils/';
import {describe, it} from 'mocha';
import {expect} from 'chai';


describe(`Network_Registry`, () => {
  let web3Connection: Web3Connection;

  let registryAddress: string;
  let networkAddress: string;
  let erc20Address: string;
  const lockAmountForNetworkCreation = 1000;
  const lockFeePercentage = 1000000;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
    const erc20 = await erc20Deployer('Name', '$symbol', toSmartContractDecimals(1000000), web3Connection);
    erc20Address = erc20.contractAddress!;
  });

  it(`Deploys`, async () => {
    const registry = new Network_Registry(web3Connection);
    await registry.loadAbi();
    const receipt = await registry.deployJsonAbi(erc20Address, lockAmountForNetworkCreation, await web3Connection.getAddress(), lockFeePercentage);
    expect(receipt.contractAddress, "Should have deployed");
    registryAddress = receipt.contractAddress;
  });

  describe(`Integration`, () => {
    let registry: Network_Registry;

    before(async () => {
      const receipt =
        await modelExtensionDeployer(
          web3Connection,
          Network_v2,
          [erc20Address, registryAddress]);

      networkAddress = receipt.contractAddress!;

      registry = new Network_Registry(web3Connection, registryAddress);
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
        await shouldBeRejected(registry.lock(1), "exceeds allowance");
      });

      it(`because no tokens to unlock`, async () => {
        await shouldBeRejected(registry.unlock(), "UL0");
      });
    });

    describe(`Green Path`, () => {
      it (`Parameters on contract should be the same of deployment`, async () => {
        expect((await registry.erc20()).toLowerCase()).to.eq(erc20Address);
        expect(+(await registry.lockAmountForNetworkCreation())).to.eq(lockAmountForNetworkCreation);
        expect(+(await registry.networkCreationFeePercentage())).to.eq(lockFeePercentage / registry.divisor);
      });

      it(`Test MAX_LOCK_PERCENTAGE_FEE should be equal to 99%`, async () => {             
        const maxLockPercentageFee = await registry.getMAX_LOCK_PERCENTAGE_FEE();        

        expect(maxLockPercentageFee).to.eq((99000000));
      });

      it(`Changes amount needed for network creation`, async () => {
        await hasTxBlockNumber(registry.changeAmountForNetworkCreation(10));
        const newLockAmount = await registry.lockAmountForNetworkCreation();

        expect(newLockAmount).to.eq((10).toString());
      });

      it(`Approves, Locks and Unlocks`, async () => {
        await hasTxBlockNumber(registry.token.approve(registryAddress, 20));
        await hasTxBlockNumber(registry.lock(10));
        await hasTxBlockNumber(registry.unlock());
      });

      it(`Locks`, async () => {
        await hasTxBlockNumber(registry.token.approve(registryAddress, 10));
        await hasTxBlockNumber(registry.lock(10));
      });

      it(`Adds the network to the registry`, async () => {
        const receipt = await registry.registerNetwork(networkAddress);
        expect(receipt.transactionHash).to.exist;
        expect(await registry.getNetworkRegisteredEvents({fromBlock: receipt.blockNumber})).to.have.lengthOf(1);
        expect(+(await registry.lockedTokensOfAddress(await web3Connection.getAddress()))).to.be.eq(10 - (10/100) * await registry.networkCreationFeePercentage());
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