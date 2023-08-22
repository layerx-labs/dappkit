import {Votable, Web3Connection} from '../../src';
import {defaultWeb3Connection, erc20Deployer, hasTxBlockNumber, increaseTime} from '../utils/';
import {toSmartContractDecimals} from '../../src/';
import {expect} from 'chai';
import {EventLog} from "web3-eth-contract/lib/commonjs/types";

describe(`Votable`, () => {
  let accountAddress: string;
  let contractAddress: string;
  let tokenContractAddress: string;

  let contract: Votable;

  const cap = 1000;
  const smartContractCap = toSmartContractDecimals(cap);
  let web3Connection: Web3Connection;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
    accountAddress = web3Connection.Account.address;
  });

  it(`Deploys`, async () => {
    const erc = await erc20Deployer(`Voting`, `$voting`, smartContractCap, web3Connection);
    const deployer = new Votable(web3Connection);
    deployer.loadAbi();

    const deployed = await deployer.deployJsonAbi(erc.contractAddress!);
    expect(deployed.contractAddress).to.exist;
    contractAddress = deployed.contractAddress!;
    tokenContractAddress = erc.contractAddress!;
  });

  describe(`Methods`, () => {
    let pollId!: number;
    before(async () => {
      contract = new Votable(web3Connection, contractAddress, tokenContractAddress);
      await contract.start();
    });

    it(`Creates a poll`, async () => {
      const tx = await contract.createPoll(`Test poll`, 3600, [0, 1]);
      expect(tx.transactionHash).to.not.be.empty;

      const events =
        await contract.contract.self
                      .getPastEvents(`pollCreated`,
                                     {fromBlock: tx.blockNumber}) as EventLog[];

      expect(events[0].returnValues["pollID"], `Event opener`).to.not.be.undefined;
      pollId = events[0].returnValues["pollID"] as number;
    });

    it(`Casts a vote`, async () => {
      await hasTxBlockNumber(contract.castVote(pollId, 0));
    })

    it(`Asserts casted vote`, async () => {
      expect(await contract.userHasVoted(pollId, accountAddress)).to.be.true;
    });

    it(`Ends poll and asserts winner`, async () => {
      await increaseTime(3602, web3Connection.Web3);
      await hasTxBlockNumber(contract.endPoll(pollId), `Should have ended Poll`);
      const pollWinner = await contract.getPoolWinner(pollId);
      const pollInfo = await contract.getPoolInformation(pollId);
      expect(pollInfo.voters[pollWinner.winnerId]).to.be.eq(accountAddress);
    });
  });


})
