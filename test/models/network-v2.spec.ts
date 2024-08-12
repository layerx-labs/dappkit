import {
  BountyToken,
  ERC20,
  Network_v2,
  NetworkRegistry,
  toSmartContractDecimals,
  Web3Connection
} from '../../src';
import {
  defaultWeb3Connection,
  erc20Deployer,
  expectEvent,
  hasTxBlockNumber,
  increaseTime,
  modelExtensionDeployer,
  shouldBeRejected
} from '../utils';
import {expect} from 'chai';

import {nativeZeroAddress} from '../../src/utils/constants';
import {type Web3Account} from "web3-eth-accounts/lib/types";
import {EventLog} from "web3-eth-contract/lib/commonjs/types";
import {getPrivateKeyFromFile} from "../utils/get-pvt-k-from-file";

const AMOUNT_1M = 1000000;

describe(`NetworkV2`, () => {
  let network: Network_v2;
  let web3Connection: Web3Connection;
  let networkToken: ERC20; // token used to "buy" oracles on the network
  let bountyTransactional: ERC20;
  let rewardToken: ERC20;
  let bountyToken: BountyToken;
  let Admin: Web3Account;
  let Alice: Web3Account;
  let Bob: Web3Account;

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

    await networkToken.start();
    await bountyTransactional.start();
    await bountyToken.start();
    await rewardToken.start();

    await bountyTransactional.transfer(Alice.address, 10000);
    await bountyTransactional.transfer(Bob.address, 10000);

  })

  describe(`No Registry`, () => {
    const convertToDivisible = (n: number) => n * 1000000;

    it(`Deploys Network_V2`, async () => {
      const _network = new Network_v2(web3Connection);
      await _network.start();
      const tx = await hasTxBlockNumber(_network.deployJsonAbi(networkToken.contractAddress!))
      expect(tx.contractAddress).to.exist;
      network = new Network_v2(web3Connection, tx.contractAddress);
      await network.start();
    });

    describe(`Owner`, () => {
      const eventParams = (param: string|number, newvalue: string|number) =>
        ({param: BigInt(param), newvalue: BigInt(newvalue)});

      type methods =
        'changeCouncilAmount'
        | 'changeDraftTime'
        | 'changeDisputableTime'
        | 'changePercentageNeededForDispute'
        | 'changeMergeCreatorFeeShare'
        | 'changeProposerFeeShare'
        | 'changeOracleExchangeRate'
        | 'changeCancelableTime'

      ([
        ['changeCouncilAmount', 103000, toSmartContractDecimals(103000, 18), 0],
        ['changeDisputableTime', 61, 61, 1],
        ['changeDraftTime', 121, 121, 2],
        ['changeOracleExchangeRate', 2, convertToDivisible(2), 3],
        ['changeMergeCreatorFeeShare', 1, convertToDivisible(1), 4],
        ['changePercentageNeededForDispute', 1, convertToDivisible(1), 5],
        ['changeCancelableTime', 15638400, 15638400, 7],
        ['changeProposerFeeShare', 1, convertToDivisible(1), 8],
      ] as [methods, number, number, number][]).forEach(([fn, value, newvalue, param]) => {
        it(`${fn}()`, async () => {
          await expectEvent(network[fn](value), 'NetworkParamChanged', eventParams(param, newvalue))
        })
      })


    });

    describe(`Public`, () => {
      let bountyId: number;

      before(async () => {
        await hasTxBlockNumber(networkToken.approve(network.contractAddress!, AMOUNT_1M));
        await hasTxBlockNumber(bountyTransactional.approve(network.contractAddress!, AMOUNT_1M));
        await hasTxBlockNumber(bountyToken.setDispatcher(network.contractAddress!))
      });

      describe(`Oracle actions`, () => {

        it(`Asserts that locked amount matches conversion`, async () => {
          await hasTxBlockNumber(networkToken.approve(network.contractAddress!, AMOUNT_1M));
          await hasTxBlockNumber(network.lock(`104999.999999999999999`));
          expect(await network.getOraclesOf(Admin.address)).to.be.eq(`209999.999999999999998000`); // * 2 rate
          await hasTxBlockNumber(network.unlock(`209999.999999999999998000`));
        })

        it(`Locks NT and receives Network Stake Token`, async () => {
          await hasTxBlockNumber(networkToken.approve(network.contractAddress!, AMOUNT_1M));
          await hasTxBlockNumber(network.lock(205000));
          expect(await network.getOraclesOf(Admin.address)).to.be.eq('410000.000000000000000000'); // we made a 1:2
          expect(await networkToken.getTokenAmount(Admin.address)).to.be.eq('795000.000000000000000000');
        });

        it(`Delegates to Alice`, async () => {
          await hasTxBlockNumber(network.delegateOracles(103000, Alice.address));
          expect(await network.getOraclesOf(Admin.address)).to.be.eq('307000.000000000000000000');
          expect(await network.getOraclesOf(Alice.address)).to.be.eq('103000.000000000000000000');

          const aliceDelegation = (await network.getDelegationsOf(Admin.address)).find(({ to }) => to === Alice.address);
          if (aliceDelegation)
            expect(aliceDelegation.amount).to.be.eq('103000.000000000000000000');
        });

        it(`Takes back from Alice`, async () => {
          await hasTxBlockNumber(network.takeBackOracles(0));
          expect(await network.getOraclesOf(Alice.address)).to.be.eq('0.000000000000000000');
          expect(await network.getOraclesOf(Admin.address)).to.be.eq('410000.000000000000000000');
        })

        it(`Unlocks NST and receives Network Token`, async () => {
          await hasTxBlockNumber(network.unlock(200000)); // because 2:1
          expect(await network.getOraclesOf(Admin.address)).to.be.eq('210000.000000000000000000');
          expect(await networkToken.getTokenAmount(Admin.address)).to.be.eq('895000.000000000000000000');
        });

        it(`Oracles Changed`, async () => {
          await expectEvent(network.lock(1000), 'OraclesChanged', {actionAmount: BigInt(toSmartContractDecimals(1000))});
        });

        it(`Oracles Transfer`, async () => {
          const delegate = await network.delegateOracles(1200, Alice.address)
          const delegateEvents = await network.getOraclesTransferEvents({fromBlock: delegate.blockNumber});
          const takeBack = await network.takeBackOracles(1);
          const takeBackEvents = await network.getOraclesTransferEvents({fromBlock: takeBack.blockNumber});
          expect(delegateEvents.length).to.be.eq(1);
          expect(takeBackEvents.length).to.be.eq(1);
        });
      });

      describe(`Bounties`, () => {
        it(`Opens`, async () => {
          const receipt = await network.openBounty(1000, bountyTransactional.contractAddress!,
            nativeZeroAddress, 0, 0,
            'c1', 'Title', '//', 'master', 'ghuser');

          const events = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber, filter: {creator: Admin.address}}) as EventLog[];

          expect(await bountyTransactional.balanceOf(network.contractAddress!)).to.eq('1000.000000000000000000');
          expect(events.length).to.be.eq(1);
          expect(events[0].returnValues.cid).to.be.eq('c1');
          // expect((await network.getBountiesOfAddress(Admin.address)).length).to.be.eq(1);
          expect(await network.bountiesIndex()).to.be.eq(1);
          // expect(await network.openBounties()).to.be.eq(1);

          bountyId = events[0].returnValues.id as number;
        });

        it(`Updates bounty amount`, async () => {
          await expectEvent(network.updateBountyAmount(bountyId, 1001), 'BountyAmountUpdated', {amount: BigInt(toSmartContractDecimals(1001))});
          expect((await network.getBounty(bountyId)).tokenAmount).to.be.eq((1001));
          expect(await bountyTransactional.getTokenAmount(network.contractAddress!)).to.eq('1001.000000000000000000');
        });

        it(`Cancels bounty`, async () => {
          web3Connection.switchToAccount(Admin.privateKey);
          const receipt = await network.cancelBounty(bountyId);
          const events = await network.getBountyCanceledEvents({fromBlock: receipt.blockNumber, filter: {id: bountyId}});
          expect(events.length).to.be.eq(1);
          // expect(await network.openBounties()).to.be.eq(0);
          expect(await bountyTransactional.getTokenAmount(Alice.address)).to.be.eq('10000.000000000000000000')
        });

        describe(`Hard cancels a bounty`,() => {
          async function prepare(cid: string) {
            const receipt = await network.openBounty(1000, bountyTransactional.contractAddress!, nativeZeroAddress, 0, 0, cid, 'Title', '//', 'master', 'ghuser');
            const [{returnValues: {id}}] = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber})  as EventLog[];
            await increaseTime(15638402, web3Connection.Web3); // 182 days + 2 seconds
            const prReceipt = await network.createPullRequest(id as number, '//', 'master', cid,'//', 'feat-1', 1);
            const [{returnValues: {pullRequestId}}] = await network.getBountyPullRequestCreatedEvents({fromBlock: prReceipt.blockNumber}) as EventLog[];
            // await network.markPullRequestReadyForReview(id as number, pullRequestId as number);
            const proposalReceipt = await network.createBountyProposal(id as number, pullRequestId as number, [nativeZeroAddress], [100]);
            const [{returnValues: {proposalId}}] = await network.getBountyProposalCreatedEvents({fromBlock: proposalReceipt.blockNumber}) as EventLog[];
            return {id, pullRequestId, proposalId} as unknown as {id: number, pullRequest: number, proposalId: number};
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
            const [{returnValues: {'4': overflow}}] = await network.getBountyProposalDisputedEvents({fromBlock}) as EventLog[];
            expect(await network.isProposalDisputed(id, proposalId)).to.be.true;
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

          const events = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber, filter: {creator: Admin.address}}) as EventLog[];
          bountyId = events[0].returnValues.id as number;
          expect(await network.getBounty(bountyId)).property('fundingAmount').to.be.eq(fundingValue)
        });

        it(`Cancel funding`, async () => {

          web3Connection.switchToAccount(Alice.privateKey);
          await bountyTransactional.approve(network.contractAddress!, AMOUNT_1M);
          await hasTxBlockNumber(network.fundBounty(bountyId, 500));

          web3Connection.switchToAccount(Bob.privateKey);
          await bountyTransactional.approve(network.contractAddress!, AMOUNT_1M);
          await hasTxBlockNumber(network.fundBounty(bountyId, 400));

          web3Connection.switchToAccount(Admin.privateKey);
          await hasTxBlockNumber(network.cancelFundRequest(bountyId));
          expect(await bountyTransactional.getTokenAmount(Alice.address)).to.be.eq('10000.000000000000000000');
          expect(await bountyTransactional.getTokenAmount(Bob.address)).to.be.eq('10000.000000000000000000');
        })

        it(`Opens Request Funding and Reward`, async () => {
          await hasTxBlockNumber(rewardToken.approve(network.contractAddress!, AMOUNT_1M), 'Should have approved rewardToken');

          const receipt = await network.openBounty(0, bountyTransactional.contractAddress!,
            rewardToken.contractAddress!, 1000, 1000,
            'c2', 'Title 2', '//', 'master', 'ghuser');

          const events = await network.getBountyCreatedEvents({fromBlock: receipt.blockNumber, filter: {creator: Admin.address}}) as EventLog[];
          bountyId = events[0].returnValues.id as number;

          expect(await network.getBounty(bountyId)).property('rewardToken').to.be.match(new RegExp(rewardToken.contractAddress!, 'i'));
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
          await hasTxBlockNumber(network.retractFunds(bountyId, 1));
          expect((await network.getBounty(bountyId)).funded).to.be.false;
        });

        it(`Cancel funding with reward token`, async () => {
          web3Connection.switchToAccount(Admin.privateKey);
          await hasTxBlockNumber(network.cancelFundRequest(bountyId));
          expect(await bountyTransactional.getTokenAmount(Alice.address)).to.be.eq('10000.000000000000000000');
          expect(await bountyTransactional.getTokenAmount(Bob.address)).to.be.eq('10000.000000000000000000');
        })
      });

      describe(`Happy path`, () => {

        it(`Creates a bounty`,async () => {
          await rewardToken.approve(network.contractAddress!, AMOUNT_1M);
          await network.openBounty(0, bountyTransactional.contractAddress!,
            rewardToken.contractAddress!, 1000, 10000,
            'c3', 'Title 3', '//', 'master', 'ghuser');

          bountyId = await network.cidBountyId('c3');
          // expect(await network.openBounties()).to.be.eq(1);

          web3Connection.switchToAccount(Alice.privateKey);
          await bountyTransactional.approve(network.contractAddress!, AMOUNT_1M);
          await hasTxBlockNumber(network.fundBounty(bountyId, 10000/2));
          await hasTxBlockNumber(network.fundBounty(bountyId, 10000/2));

          web3Connection.switchToAccount(Admin.privateKey);
          await increaseTime(62, web3Connection.Web3);
          await network.lock(await network.councilAmount());
          await increaseTime(await network.draftTime() + 60, web3Connection.Web3);
        });

        it (`Creates prId 0`, async () => {
          await expectEvent(network.createPullRequest(bountyId, '//', 'master',
            'c3','//', 'feat-1', 1), 'BountyPullRequestCreated', {pullRequestId: BigInt(0)});
        })

        it(`Cancels prId 0`, async () => {
          await hasTxBlockNumber(network.cancelPullRequest(bountyId, 0));
          expect((await network.getBounty(bountyId)).pullRequests[0].canceled).to.be.true;
        })

        it(`Creates prId 1`, async () => {
          await expectEvent(network.createPullRequest(bountyId, '//', 'master',
            'c4','//', 'feat-2', 1), 'BountyPullRequestCreated', {pullRequestId: BigInt(1)});
        });

        // it(`Should be unable to create a Proposal because prId 1 is not ready`, async () => {
        //   await shouldBeRejected(network.createBountyProposal(bountyId, 1, [Alice.address, Bob.address], [51, 49]));
        // });

        it(`Set prId 1 as Ready`, async () => {
          // await hasTxBlockNumber(network.markPullRequestReadyForReview(bountyId, 1));
          expect((await network.getBounty(bountyId)).pullRequests[1].ready).to.be.true;
        });

        it (`Creates proposal for prId 1`, async () => {
          await hasTxBlockNumber(network.createBountyProposal(bountyId, 1, [Alice.address, Bob.address], [51, 49]));
          expect((await network.getBounty(bountyId)).proposals.length).to.be.eq(1);
        })

        it(`Should be unable to cancel a prId 1 because exists a Proposal`, async () => {
          await shouldBeRejected(network.cancelPullRequest(bountyId, 1));
        });

        it(`Disputes a Proposal`, async () => {
          await hasTxBlockNumber(network.createPullRequest(bountyId, '//', 'master',
            'c5','//', 'feat-2', 1));
          // await hasTxBlockNumber(network.markPullRequestReadyForReview(bountyId, 2));
          await hasTxBlockNumber(network.createBountyProposal(bountyId, 2, [Alice.address, Bob.address], [51, 49]));
          await hasTxBlockNumber(network.disputeBountyProposal(bountyId, 1));
          expect(+(await network.getBounty(bountyId)).proposals[1].disputeWeight).to.be.greaterThan(0);
          expect(+(await network.disputes(Admin.address, bountyId, 1))).to.be.greaterThan(0);
        });

        it(`Refuses as owner`, async () => {
          await hasTxBlockNumber(network.refuseBountyProposal(bountyId, 0));
          expect((await network.getBounty(bountyId)).proposals[0].refusedByBountyOwner).to.be.true;
        });

        it(`Creates Proposal and closes Bounty`, async () => {
          await hasTxBlockNumber(network.createPullRequest(bountyId, '//', 'master',
            'c6','//', 'feat-2', 1));



          // await hasTxBlockNumber(network.markPullRequestReadyForReview(bountyId, 3));
          await hasTxBlockNumber(network.createBountyProposal(bountyId, 3, [Alice.address, Bob.address], [51, 49]), `Should create proposal`);

          await increaseTime(62, web3Connection.Web3);
          const bounty = await network.getBounty(bountyId);
          expect(bounty.proposals.length).to.be.eq(3);

          await hasTxBlockNumber(network.closeBounty(bountyId, 2), `Should have closed bounty`);

          // expect(await network.openBounties()).to.be.eq(0);
          expect(await bountyTransactional.getTokenAmount(Alice.address)).to.be.eq('4998.510000000000000000');
          expect(await bountyTransactional.getTokenAmount(Bob.address)).to.be.eq('14802.490000000000000000');
        });

        it(`Alice withdraws from bounty`, async () => {
          await hasTxBlockNumber(network.withdrawFundingReward(bountyId, 0));
          expect(await rewardToken.balanceOf(Alice.address)).to.be.eq('500.000000000000000000');
          await hasTxBlockNumber(network.withdrawFundingReward(bountyId, 1));
          expect(await rewardToken.balanceOf(Alice.address)).to.be.eq('1000.000000000000000000');
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
      const networkReceipt = await modelExtensionDeployer(web3Connection, Network_v2, [networkToken.contractAddress, registryReceipt.contractAddress]);

      network = new Network_v2(web3Connection, networkReceipt.contractAddress);
      await network.start();
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
          await hasTxBlockNumber(network.registry.removeAllowedTokens([networkToken.contractAddress!], false));
          await hasTxBlockNumber(network.registry.removeAllowedTokens([networkToken.contractAddress!], true));
          const {transactional, reward} = await network.registry.getAllowedTokens();

          expect(transactional.length).to.eq(0);
          expect(reward.length).to.eq(0);

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
          '//', 'master', 'ghuser'), `6`);
      })
    })

  })
});
