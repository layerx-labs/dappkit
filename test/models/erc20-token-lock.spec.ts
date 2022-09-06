import {
  defaultWeb3Connection,
  erc20Deployer, getChainDate,
  hasTxBlockNumber,
  increaseTime,
  shouldBeRejected
} from '../utils/';
import {Erc20TokenLock, Web3Connection, toSmartContractDecimals} from '../../src';
import {expect} from 'chai';
import {addSeconds} from 'date-fns'

describe(`ERC20TokenLock`, () => {
  let contractAddress!: string;
  let accountAddress!: string;
  let tokenLock: Erc20TokenLock;

  const cap = toSmartContractDecimals(1000000);
  let web3Connection: Web3Connection;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
  })

  it(`Deploys Contract`, async () => {
    const erc20 = await erc20Deployer(`TokenLock`, `$lock`, cap, web3Connection);
    const deployer = new Erc20TokenLock(web3Connection);
    deployer.loadAbi();

    const deployed = await deployer.deployJsonAbi(erc20.contractAddress!)
    expect(deployed.contractAddress).to.not.be.empty;
    contractAddress = deployed.contractAddress!;
  });

  describe(`Methods`, () => {
    before(async () => {
      tokenLock = new Erc20TokenLock(web3Connection, contractAddress);
      accountAddress = web3Connection.Account.address;
      await tokenLock.loadContract();
    });

    it(`Sets max amount to lock`, async () => {
      expect(await tokenLock.setMaxAmountToLock(2)).to.have.property('blockNumber').to.exist;
      expect(await tokenLock.getMaxLock()).to.eq((2).toString());
    });

    it(`Sets min amount to lock`, async () => {
      expect(await tokenLock.setMinAmountToLock(1)).to.have.property('blockNumber').to.exist;
      expect(await tokenLock.getMinLock()).to.eq((1).toString());
    });

    it(`locks tokens and fails unlock because endDate was not reached`, async () => {
      const endDate = +addSeconds(await getChainDate(web3Connection), 62);
      await tokenLock.approveERC20Transfer();

      await hasTxBlockNumber(tokenLock.lock(1, endDate));
      expect(await tokenLock.getLockedTokens(accountAddress), `get locked tokens`).to.eq((1).toString());
      expect(await tokenLock.totalAmountStaked(), `get total locked`).to.eq((1).toString());
      await shouldBeRejected(tokenLock.release(), `release date`);
    });

    it(`Should unlock because time-travel`, async () => {
      await increaseTime(62, web3Connection.Web3);
      await hasTxBlockNumber(tokenLock.release());
      expect(await tokenLock.getLockedTokens(accountAddress), `get locked tokens`).to.eq((0).toString());
    });

  });
});
