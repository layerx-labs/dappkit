import {ERC20, Network_v2, BountyToken, toSmartContractDecimals, Web3Connection, NetworkRegistry} from '../../src';
import {
  defaultWeb3Connection,
  erc20Deployer,
  getPrivateKeyFromFile,
  hasTxBlockNumber,
  increaseTime, modelExtensionDeployer,
  shouldBeRejected
} from '../utils';
import {expect} from 'chai';
import {AMOUNT_1M} from '../utils/constants';
import {nativeZeroAddress, Thousand} from '../../src/utils/constants';
import {Account} from 'web3-core';


describe(`NetworkV2`, () => {
  let network: Network_v2;
  let web3Connection: Web3Connection;
  let networkToken: ERC20; // token used to "buy" oracles on the network
  let bountyTransactional: ERC20;
  let rewardToken: ERC20;
  let bountyToken: BountyToken;
  let Admin: Account;
  let Alice: Account;
  let Bob: Account;

  const cap = toSmartContractDecimals(AMOUNT_1M);
  const newCouncilAmount = 105000;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
    Admin = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile());
    Alice = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1));
    Bob = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(2));

    const networkReceipt = await erc20Deployer(`settler`, `#`, cap, web3Connection);
    const transactionalReceipt = await erc20Deployer(`transactional`, `$`, cap, web3Connection);
    const rewardReceipt = await erc20Deployer(`reward`, `&`, cap, web3Connection);
    const nftReceipt = await modelExtensionDeployer(web3Connection, BountyToken, [`bounty`, `~`]);

    networkToken = new ERC20(web3Connection, networkReceipt.contractAddress);
    bountyTransactional = new ERC20(web3Connection, transactionalReceipt.contractAddress);
    rewardToken = new ERC20(web3Connection, rewardReceipt.contractAddress);
    bountyToken = new BountyToken(web3Connection, nftReceipt.contractAddress);

    await networkToken.loadContract();
    await bountyTransactional.loadContract();
    await bountyToken.loadContract();
    await rewardToken.loadContract();

    await bountyTransactional.transferTokenAmount(Alice.address, 10000);
    await bountyTransactional.transferTokenAmount(Bob.address, 10000);

  })

  describe(`No Registry`, () => {
    it(`Deploys Network_V2`, async () => {
      const _network = new Network_v2(web3Connection);
      _network.loadAbi();
      const receipt = await _network.deployJsonAbi(networkToken.contractAddress!, bountyToken.contractAddress!, `//`)
      expect(receipt.contractAddress).to.exist;
      network = new Network_v2(web3Connection, receipt.contractAddress);
      await network.loadContract();
    });

    describe(`Owner`, () => {
      it(`changeCouncilAmount()`, async () => {
        await hasTxBlockNumber(network.changeCouncilAmount(newCouncilAmount));
        expect(await network.councilAmount()).to.eq(newCouncilAmount);
      });

      it(`changeDraftTime()`, async () => {
        await hasTxBlockNumber(network.changeDraftTime(61));
        expect(await network.draftTime()).to.eq(61000);
      });

      it(`changeDisputableTime()`, async () => {
        await hasTxBlockNumber(network.changeDisputableTime(61));
        expect(await network.disputableTime()).to.eq(61000);
      });

      it(`changePercentageNeededForDispute()`, async () => {
        await hasTxBlockNumber(network.changePercentageNeededForDispute(1));
        expect(await network.percentageNeededForDispute()).to.eq(1);
      });

      it(`changeMergeCreatorFeeShare()`, async () => {
        await hasTxBlockNumber(network.changeMergeCreatorFeeShare(1));
        expect(await network.mergeCreatorFeeShare()).to.eq(1);
      });

      it(`changeOracleExchangeRate()`, async () => {
        await hasTxBlockNumber(network.changeOracleExchangeRate(2));
        expect(await network.oracleExchangeRate()).to.eq(2);
      });

      it(`changeCancelableTime()`, async () => {
        await hasTxBlockNumber(network.changeCancelableTime(15638400)); // 181 days
        expect(await network.cancelableTime()).to.eq(15638400 * Thousand);
      });

    });

    describe(`Public`, () => {
      let bountyId: number;
      let prId: number;

      before(async () => {
        await hasTxBlockNumber(networkToken.approve(network.contractAddress!, AMOUNT_1M));
        await hasTxBlockNumber(bountyTransactional.approve(network.contractAddress!, AMOUNT_1M));
        await hasTxBlockNumber(bountyToken.setDispatcher(network.contractAddress!))
      });

      describe(`Oracle actions`, () => {
        it(`Locks NT and receives Network Stake Token`, async () => {
          await hasTxBlockNumber(networkToken.approve(network.contractAddress!, AMOUNT_1M));
          await hasTxBlockNumber(network.lock(205000));
          expect(await network.getOraclesOf(Admin.address)).to.be.eq(205000 * 2); // we made a 1:2
          expect(await networkToken.getTokenAmount(Admin.address)).to.be.eq(AMOUNT_1M - 205000);
        });

        it(`Delegates to Alice`, async () => {
          await hasTxBlockNumber(network.delegateOracles(103000, Alice.address));
          expect(await network.getOraclesOf(Admin.address)).to.be.eq((205000 * 2) - 103000);
          expect(await network.getOraclesOf(Alice.address)).to.be.eq(103000);
        });

        it(`Takes back from Alice`, async () => {
          await hasTxBlockNumber(network.takeBackOracles(0));
          expect(await network.getOraclesOf(Alice.address)).to.be.eq(0);
          expect(await network.getOraclesOf(Admin.address)).to.be.eq(205000 * 2);
        })

        it(`Unlocks NST and receives Network Token`, async () => {
          await hasTxBlockNumber(network.unlock(200000)); // because 2:1
          expect(await network.getOraclesOf(Admin.address)).to.be.eq((105000 * 2));
          expect(await networkToken.getTokenAmount(Admin.address)).to.be.eq(AMOUNT_1M - 105000);
        });
      });

      describe(`Bounties`, () => {
        it(`Opens`, async () => {
          const receipt = await network.openBounty(1000, bountyTransactional.contractAddress!,
            nativeZeroAddress, 0, 0,
            'c1', 'Title', '//', 'master', 'ghuser');

          const events = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber, filter: {creator: Admin.address}});

          expect(events.length).to.be.eq(1);
          expect(events[0].returnValues.cid).to.be.eq('c1');
          expect((await network.getBountiesOfAddress(Admin.address)).length).to.be.eq(1);
          expect(await network.bountiesIndex()).to.be.eq(1);
          expect(await network.openBounties()).to.be.eq(1);

          bountyId = events[0].returnValues.id;
        });

        it(`Updates bounty amount`, async () => {
          const receipt = await network.updateBountyAmount(bountyId, 1001);

          const events = await network.getBountyAmountUpdatedEvents({fromBlock: receipt.blockNumber, filter: {id: bountyId}});

          expect(events[0].returnValues.amount).to.be.eq(toSmartContractDecimals(1001, bountyTransactional.decimals));
          expect((await network.getBounty(bountyId)).tokenAmount).to.be.eq(1001);
        });

        it(`Oracles Changed`, async () => {
          const receipt = await network.lock(1000);
          const events = await network.getOraclesChangedEvents({fromBlock: receipt.blockNumber, filter: {id: bountyId}});
          expect(events.length).to.be.eq(1);
        });

        it(`Cancels bounty`, async () => {
          web3Connection.switchToAccount(Admin.privateKey);
          const receipt = await network.cancelBounty(bountyId);
          const events = await network.getBountyCanceledEvents({fromBlock: receipt.blockNumber, filter: {id: bountyId}});
          expect(events.length).to.be.eq(1);
          expect(await network.openBounties()).to.be.eq(0);
          expect(await bountyTransactional.getTokenAmount(Alice.address)).to.be.eq(10000)
        });

        describe(`Hard cancels a bounty`,() => {
          async function prepare(cid: string) {
            const receipt = await network.openBounty(1000, bountyTransactional.contractAddress!, nativeZeroAddress, 0, 0, cid, 'Title', '//', 'master', 'ghuser');
            const [{returnValues: {id}}] = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber});
            await increaseTime(15638402, web3Connection.Web3); // 182 days + 2 seconds
            const prReceipt = await network.createPullRequest(id, '//', 'master', cid,'//', 'feat-1', 1);
            const [{returnValues: {pullRequestId}}] = await network.getBountyPullRequestCreatedEvents({fromBlock: prReceipt.blockNumber});
            await network.markPullRequestReadyForReview(id, pullRequestId);
            const proposalReceipt = await network.createBountyProposal(id, pullRequestId, [nativeZeroAddress], [100]);
            const [{returnValues: {proposalId}}] = await network.getBountyProposalCreatedEvents({fromBlock: proposalReceipt.blockNumber});
            return {id, pullRequestId, proposalId};
          }

          it(`by refusal`, async () => {
            const {id, proposalId} = await prepare('c5');
            await network.refuseBountyProposal(id, proposalId);
            await hasTxBlockNumber(network.hardCancel(id));
            expect((await network.getBounty(id)).canceled).to.be.true;
          });

          it(`by dispute`, async () => {
            const {id, proposalId} = await prepare('c6');
            await network.lock(newCouncilAmount*3);
            const {blockNumber: fromBlock} = await network.disputeBountyProposal(id, proposalId);
            const [{returnValues: {'4': overflow}}] = await network.getBountyProposalDisputedEvents({fromBlock});
            expect(overflow).to.be.true;
            await hasTxBlockNumber(network.hardCancel(id));
            expect((await network.getBounty(id)).canceled).to.be.true;
          });
        })

      });

      describe(`Funding`, async () => {
        it(`Opens Request Funding`, async () => {
          const fundingValue = 1000
          const receipt = await network.openBounty(0, bountyTransactional.contractAddress!,
            nativeZeroAddress, 0, fundingValue,
            'c7', 'Title 7', '//', 'master', 'ghuser');

          const events = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber, filter: {creator: Admin.address}});
          bountyId = events[0].returnValues.id;
          expect(await network.getBounty(bountyId)).property('fundingAmount').to.be.eq(fundingValue)
        });

        it(`Opens Request Funding and Reward`, async () => {
          await hasTxBlockNumber(rewardToken.approve(network.contractAddress!, AMOUNT_1M), 'Should have approved rewardToken');

          const receipt = await network.openBounty(0, bountyTransactional.contractAddress!,
            rewardToken.contractAddress!, 1000, 1000,
            'c2', 'Title 2', '//', 'master', 'ghuser');

          const events = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber, filter: {creator: Admin.address}});
          bountyId = events[0].returnValues.id;

          expect(await network.getBounty(bountyId)).property('rewardToken').to.be.eq(rewardToken.contractAddress!);
        });

        it(`Fund 50-50`, async () => {
          expect((await network.getBounty(bountyId)).funded).to.be.false;

          web3Connection.switchToAccount(Alice.privateKey);
          await bountyTransactional.approve(network.contractAddress!, AMOUNT_1M);
          await hasTxBlockNumber(network.fundBounty(bountyId, 500));

          web3Connection.switchToAccount(Bob.privateKey);
          await bountyTransactional.approve(network.contractAddress!, AMOUNT_1M);
          await hasTxBlockNumber(network.fundBounty(bountyId, 500));

          expect((await network.getBounty(bountyId)).funded).to.be.true;
        });

        it(`Retracts Bobs funding`, async () => {
          await hasTxBlockNumber(network.retractFunds(bountyId, [1]));
          expect((await network.getBounty(bountyId)).funded).to.be.false;
        });

        it(`Cancels funding`, async () => {
          web3Connection.switchToAccount(Admin.privateKey);
          await hasTxBlockNumber(network.cancelFundRequest(bountyId));
          expect(await bountyTransactional.getTokenAmount(Alice.address)).to.be.eq(10000);
          expect(await bountyTransactional.getTokenAmount(Bob.address)).to.be.eq(10000);
        })
      });

      describe(`Happy path`, () => {

        it(`Creates a bounty`,async () => {
          await rewardToken.approve(network.contractAddress!, AMOUNT_1M);
          await network.openBounty(0, bountyTransactional.contractAddress!,
            rewardToken.contractAddress!, 1000, 10000,
            'c3', 'Title 3', '//', 'master', 'ghuser');

          bountyId = await network.cidBountyId('c3');
          expect(await network.openBounties()).to.be.eq(2);

          web3Connection.switchToAccount(Alice.privateKey);
          await bountyTransactional.approve(network.contractAddress!, AMOUNT_1M);
          await hasTxBlockNumber(network.fundBounty(bountyId, 10000));

          web3Connection.switchToAccount(Admin.privateKey);
          await increaseTime(62, web3Connection.Web3);
          await network.lock(await network.councilAmount());
        });

        it(`Creates a PR and cancel`, async () => {
          const receipt = await network.createPullRequest(bountyId, '//', 'master',
            'c3','//', 'feat-1', 1);

          const events = await network.getBountyPullRequestCreatedEvents({fromBlock: receipt.blockNumber, filter: {id: bountyId}})
          expect(events.length).to.be.eq(1);
          prId = events[0].returnValues.pullRequestId;

          await hasTxBlockNumber(network.cancelPullRequest(bountyId, prId));
          expect((await network.getBounty(bountyId)).pullRequests[prId].canceled).to.be.true;
        });

        it(`Creates a PR`, async () => {
          const receipt = await network.createPullRequest(bountyId, '//', 'master',
            'c4','//', 'feat-2', 1);

          const events = await network.getBountyPullRequestCreatedEvents({fromBlock: receipt.blockNumber, filter: {id: bountyId}})
          expect(events.length).to.be.eq(1);
          prId = events[0].returnValues.pullRequestId;
        });

        it(`Should be unable to create a Proposal because PR is not ready`, async () => {
          await shouldBeRejected(network.createBountyProposal(bountyId, prId, [Alice.address, Bob.address], [51, 49]));
        });

        it(`Set PR as Ready and Creates a Proposal`, async () => {
          await hasTxBlockNumber(network.markPullRequestReadyForReview(bountyId, prId));
          expect((await network.getBounty(bountyId)).pullRequests[prId].ready).to.be.true;

          await hasTxBlockNumber(network.createBountyProposal(bountyId, prId, [Alice.address, Bob.address], [51, 49]));
          expect((await network.getBounty(bountyId)).proposals.length).to.be.eq(1);
        });

        it(`Should be unable to cancel a Pull Request because exists a Proposal`, async () => {
          await shouldBeRejected(network.cancelPullRequest(bountyId, prId));
        });

        it(`Disputes a Proposal`, async () => {
          await hasTxBlockNumber(network.disputeBountyProposal(bountyId, 0));
          expect(+(await network.getBounty(bountyId)).proposals[0].disputeWeight).to.be.greaterThan(0);
          expect(+(await network.disputes(Admin.address, bountyId, 0))).to.be.greaterThan(0);
        });

        it(`Refuses as owner`, async () => {
          await hasTxBlockNumber(network.refuseBountyProposal(bountyId, 0));
          expect((await network.getBounty(bountyId)).proposals[0].refusedByBountyOwner).to.be.true;
        });

        it(`Creates Proposal and closes Bounty`, async () => {
          await hasTxBlockNumber(network.createBountyProposal(bountyId, prId, [Alice.address, Bob.address], [51, 49]), `Should create proposal`);
          await increaseTime(62, web3Connection.Web3);
          const bounty = await network.getBounty(bountyId);
          expect(bounty.proposals.length).to.be.eq(2);

          await hasTxBlockNumber(network.closeBounty(bountyId, 1), `Should have closed bounty`);

          const bountyTokenAmount = bounty.tokenAmount;
          const mergerAmount = bountyTokenAmount / 100 * await network.mergeCreatorFeeShare();
          const proposerAmount = (bountyTokenAmount - mergerAmount) / 100 * await network.proposerFeeShare();
          const bountyAmount = bountyTokenAmount - mergerAmount - proposerAmount;
          const AliceAmount = bountyAmount / 100 * 51;
          const BobAmount = bountyAmount / 100 * 49;

          expect(await network.openBounties()).to.be.eq(1);
          expect(await rewardToken.getTokenAmount(Alice.address)).to.be.eq(1000);
          expect(await bountyTransactional.getTokenAmount(Alice.address)).to.be.eq(+Number(AliceAmount).toFixed(2));
          expect(await bountyTransactional.getTokenAmount(Bob.address)).to.be.eq(+Number(BobAmount + 10000).toFixed(2));
        });
      });
    });
  });

  describe(`With Registry`, () => {
    async function allowTokens() {
      await hasTxBlockNumber(network.registry.addAllowedTokens([networkToken.contractAddress!], false));
      await hasTxBlockNumber(network.registry.addAllowedTokens([networkToken.contractAddress!], true));
    }

    before(async() => {
      const registryReceipt = await modelExtensionDeployer(web3Connection, NetworkRegistry, [networkToken.contractAddress, 1000, await web3Connection.getAddress(), 10000]);
      const networkReceipt = await modelExtensionDeployer(web3Connection, Network_v2, [networkToken.contractAddress, bountyToken.contractAddress, `//`, registryReceipt.contractAddress]);

      network = new Network_v2(web3Connection, networkReceipt.contractAddress);
      await network.loadContract();
    });


    describe(`Manage tokens as registry owner`, () => {
        before(async () => {
          await allowTokens();
        });

        it(`Allows networkToken to be used as a transactional and reward`, async () => {
          const {transactional, reward} = await network.registry.getAllowedTokens();
          expect(transactional.length).to.eq(1);
          expect(reward.length).to.eq(1);
        })

        it(`Asserts allowed tokens removal`, async () => {
          await hasTxBlockNumber(network.registry.removeAllowedTokens([0], false));
          await hasTxBlockNumber(network.registry.removeAllowedTokens([0], true));
          const {transactional, reward} = await network.registry.getAllowedTokens();

          // Assert to length 0 because we parse the nativeZero addresses from the returned arrays
          expect(transactional.length).to.eq(0);
          expect(reward.length).to.eq(0);

          // Assert base key/item matches a nativeZero address
          const tokens = await Promise.all([network.registry.allowedTokens(0,0), network.registry.allowedTokens(1,0)])
          expect(tokens.every(k => k === nativeZeroAddress)).to.be.true;

        });

        after(`Add back tokens`,async () => {
          await allowTokens();
        })
      });

    describe(`Bounties`, () => {
      it(`Opens a funding request with allowed tokens`, async () => {
        await hasTxBlockNumber(networkToken.approve(network.contractAddress!, 1));
        await hasTxBlockNumber(network.openBounty(0, networkToken.contractAddress!,
          networkToken.contractAddress!, 1, 1, 'rc1', 'Title',
          '//', 'master', 'ghuser'), `open bounty`);
      })

      it(`Opens a simple bounty with the allowed token`, async () => {
        await hasTxBlockNumber(network.networkToken.approve(network.contractAddress!, 1));
        await hasTxBlockNumber(network.openBounty(1, networkToken.contractAddress!,
          nativeZeroAddress, 0, 0, 'rc1', 'Title',
          '//', 'master', 'ghuser'), `open bounty`);
      })

      it(`Should fail to open a bounty because wrong token`, async () => {
        await hasTxBlockNumber(bountyTransactional.approve(network.contractAddress!, 1))
        await shouldBeRejected(network.openBounty(1, bountyTransactional.contractAddress,
          nativeZeroAddress, 0, 0, 'rc2', 'Title',
          '//', 'master', 'ghuser'), `O6`);
      })
    })

  })
});
