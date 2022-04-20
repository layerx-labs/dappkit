import {Network_v2, NetworkFactoryV2, Web3Connection, fromDecimals, toSmartContractDecimals} from '../../src';
import {shouldBeRejected, defaultWeb3Connection, erc20Deployer, hasTxBlockNumber, modelExtensionDeployer} from '../utils';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {Errors} from '../../src/interfaces/error-enum';
import { BountyToken } from '../../src/models/bounty-token';
import {nativeZeroAddress} from '../../src/utils/constants';

describe(`NetworkFactoryV2`, () => {

  let web3Connection: Web3Connection;
  let networkFactoryContractAddress!: string;
  let settlerToken: string;
  let networkToken: string;
  let bountyToken: string;
  let accountAddress: string;

  const cap = toSmartContractDecimals(1000000);

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
    accountAddress = web3Connection.Account.address;
  })


  describe(`Deploy`, () => {

    it(`SettlerToken`, async () => {
      const receipt = await erc20Deployer(`Settler`, `$settler`, cap, web3Connection);
      expect(receipt.contractAddress).to.not.be.empty;
      settlerToken = receipt.contractAddress!;
    });

    it(`NetworkToken`, async () => {
      const receipt = await erc20Deployer(`Usage`, `$usage`, cap, web3Connection);
      expect(receipt.contractAddress).to.not.be.empty;
      networkToken = receipt.contractAddress!;
    });

    it(`BountyToken`, async () => {
      const receipt = await modelExtensionDeployer(web3Connection, BountyToken, [`bounty`, `~`]);
      expect(receipt.contractAddress).to.not.be.empty;
      bountyToken = receipt.contractAddress!;
    });

    it(`Network Factory Contract`, async () => {
      const deployer = new NetworkFactoryV2(web3Connection);
      await deployer.loadAbi();
      const receipt = await deployer.deployJsonAbi(settlerToken!);
      expect(receipt.contractAddress).to.not.be.empty;
      networkFactoryContractAddress = receipt.contractAddress!;
    });
  });


  describe(`Integration`, () => {
    let networkFactory: NetworkFactoryV2;

    before(async () => {
      networkFactory = new NetworkFactoryV2(web3Connection, networkFactoryContractAddress);
      await networkFactory.loadContract();
    })

    it(`Matches token address`, async () => {
      expect(await networkFactory.erc20NetworkToken()).to.be.eq(settlerToken);
    });

    it(`Throws because no locked amount`, async () => {
      await shouldBeRejected(networkFactory.createNetwork(networkToken!, bountyToken!, '//'), `CN2`);
    });

    it(`Throws because trying to lock 0`, async () => {
      await shouldBeRejected(networkFactory.lock(0), Errors.AmountNeedsToBeHigherThanZero)
    });

    it(`Throws because needs allow`, async () => {
      await shouldBeRejected(networkFactory.lock(1), `exceeds allowance`);
    });

    it(`Throws because no coins to unlock`, async () => {
      await shouldBeRejected(networkFactory.unlock(), `UL0`);
    });

    it(`Approves, locks and unlocks settler`, async () => {
      await networkFactory.approveNetworkToken(+fromDecimals(cap));
      const tx = await networkFactory.lock(+fromDecimals(cap));
      expect(tx.blockHash, `lock action`).to.not.be.empty;
      expect(await networkFactory.tokensLocked(), `locked total`).to.eq(+fromDecimals(cap));
      await hasTxBlockNumber(networkFactory.unlock());
      expect(await networkFactory.tokensLocked(), `locked total`).to.eq(0);
    });

    it(`Should lock and create a new network`, async () => {
      await networkFactory.approveNetworkToken(+fromDecimals(cap));
      await hasTxBlockNumber(networkFactory.lock(+fromDecimals(cap)));
      const tx = await networkFactory.createNetwork(networkToken!, bountyToken!, '//');
      expect(await networkFactory.amountOfNetworks(), `Amount of networks`).to.eq(1);

      const event = await networkFactory.contract.self.getPastEvents(`NetworkCreated`, {filter: {transactionHash: tx.transactionHash}});
      expect(event[0].returnValues['creator'], `Event opener`).to.be.eq(accountAddress);
    });

    it(`Throws because one network per user`, async () => {
      await shouldBeRejected(networkFactory.createNetwork(networkToken!, bountyToken!, '//'), `CN1`);
    });

    describe(`With network`, () => {
      let network!: Network_v2;

      before(async () => {
        network = new Network_v2(web3Connection, await networkFactory.networkOfAddress(accountAddress));
        await network.loadContract();
      })

      it(`Asserts governor === accountAddress`, async () => {
        await hasTxBlockNumber(network.sendTx(network.contract.methods.claimGovernor()))
        expect(await network.callTx(network.contract.methods._governor())).to.be.eq(accountAddress);
      })

      it(`Locks tokens and throws because can't unlock`, async () => {
        await network.settlerToken.approve(network.contractAddress!, 10);
        await network.lock(10);
        await shouldBeRejected(networkFactory.unlock(), `UL1`);
        await network.unlock(10);
      });

      it(`Creates an issue and throws because can't unlock`, async () => {
        await network.settlerToken.approve(network.contractAddress!, 1000);
        await network.openBounty(1000, networkToken!, nativeZeroAddress, 0, 0, 'c1', 'Title', '//', 'master', 'ghuser');
        await shouldBeRejected(networkFactory.unlock(), `UL2`);
        await network.updateBountyAmount(1, 0);
        await network.cancelBounty(1);
      });

      it(`Change draft time`, async () => {
        await hasTxBlockNumber(network.changeDraftTime(60), `Should have changed draft time`);
        expect(await network.draftTime()).to.be.eq(60);
      });

      it(`Changes disputable time`, async () => {
        await hasTxBlockNumber(network.changeDisputableTime(120));
      })

      it(`Should unlock because issue was redeemed`, async () => {
        await hasTxBlockNumber(networkFactory.unlock(), `should have unlocked`);
      });

      it(`Creates a new network because we have already unlocked`, async () => {
        const creatorAmount = await networkFactory.creatorAmount();
        await networkFactory.approveNetworkToken(creatorAmount);
        await networkFactory.lock(creatorAmount);
        await hasTxBlockNumber(networkFactory.createNetwork(networkToken!, bountyToken!, '//'), `Should have created network`)
      })
    })
  })
})
