import {StakingContract, StakingProduct, StakingSubscription, Web3Connection} from '../../src';
import {
  defaultWeb3Connection,
  erc20Deployer, getChainDate,
  hasTxBlockNumber,
  increaseTime,
} from '../utils/';
import {toSmartContractDecimals} from '../../src';
import {addMinutes, differenceInSeconds} from 'date-fns'
import {expect} from 'chai';
import BigNumber from 'bignumber.js';

describe(`StakingContract`, () => {
  let contract: StakingContract;
  let contractAddress: string;
  let stakeTokenAddress: string;

  let product: StakingProduct;
  let subscription: StakingSubscription;

  let endDate: number;
  let startDate: number;

  let totalNeededAPR: number;

  const stakeTokenCap = toSmartContractDecimals(1000);
  let web3Connection: Web3Connection;

  const APR = 5;
  const totalMaxAmount = 100;
  const individualMinAmount = 10;
  const individualMaxAmount = 30;

  const calculateApr = (_amount: string | number, time: number) => ((((APR / 365 / 24 / 60) * time) / 60) * +_amount) / 100;
  // const userDepositNeeded = calculateApr(individualMinAmount);


  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true)
  });

  it(`Deploys contract`, async () => {
    const erc20 = await erc20Deployer(`Staking`, `$stake`, stakeTokenCap, web3Connection);
    const deployer = new StakingContract(web3Connection);
    deployer.loadAbi();

    const deployed = await deployer.deployJsonAbi(erc20.contractAddress!);
    expect(deployed.contractAddress).to.exist;
    contractAddress = deployed.contractAddress!;
    stakeTokenAddress = erc20.contractAddress!;
  });

  describe(`Methods`, () => {
    before(async () => {
      contract = new StakingContract(web3Connection, contractAddress, stakeTokenAddress);
      await contract.start();
    });

    it(`Approves transfers`, async () => {
      await hasTxBlockNumber(contract.approveERC20Transfer());
    });

    it(`Creates a staking product`, async () => {

      const time = await getChainDate(web3Connection)

      endDate = +addMinutes(time, 60);
      startDate = +addMinutes(time, 5);
      totalNeededAPR = calculateApr(totalMaxAmount, differenceInSeconds(endDate, startDate));

      await hasTxBlockNumber(
        contract.createProduct(startDate, endDate, totalMaxAmount, individualMinAmount,
                               individualMaxAmount, APR, false));

      const ids = await contract.getProductIds();

      expect(ids).to.have.length(1);

      product = await contract.getProduct(ids[0])
      expect(product.createdAt).to.not.be.false;
    });

    it(`Should deposit needed to apr admin`, async () => {
      const {APR, startDate, endDate, totalMaxAmount} = product;
      const totalNeeded = await contract.getAPRAmount(APR, startDate, endDate, totalMaxAmount);

      await hasTxBlockNumber(contract.depositAPRTokens(totalNeeded));
      expect(await contract.getTotalProductsAPRAmount()).to.eq(totalNeeded);
    });

    it(`Subscribes to product`, async () => {
      const time = await getChainDate(web3Connection)
      const startDifference = differenceInSeconds(startDate, time);

      if (startDifference > 0)
        await increaseTime(startDifference+60, web3Connection.Web3);

      await hasTxBlockNumber(contract.subscribeProduct(product._id, product.individualMinimumAmount));
      subscription = await contract.getSubscription(0, product._id);

      expect(subscription.startDate).to.be.greaterThan(0);
    });

    it(`Checks held tokens`, async () => {
      expect(+(await contract.heldTokens()))
        .to.be.greaterThanOrEqual(individualMinAmount + totalNeededAPR) // there's some seconds we can't account for
    });

    it(`Checks future locked tokens`, async () => {
      const apr = calculateApr(product.individualMinimumAmount, differenceInSeconds(subscription.endDate, subscription.startDate));
      const futureLockedTokens = new BigNumber(apr).plus(product.individualMinimumAmount).toFixed(18, 1);

      expect(await contract.futureLockedTokens()).to.eq(futureLockedTokens);
    });

    it(`Withdraws subscription`, async () => {
      const time = await getChainDate(web3Connection);
      const difference = differenceInSeconds(subscription.endDate, time);
      if (difference > 0)
        await increaseTime(difference, web3Connection.Web3);

      await hasTxBlockNumber(contract.withdrawSubscription(product._id, subscription._id));
      const {finalized, withdrawAmount, amount} = await contract.getSubscription(subscription._id, product._id);
      const aprAmount = await contract.getAPRAmount(APR, subscription.startDate, subscription.endDate, amount);
      const expectedWithdraw = new BigNumber(aprAmount).plus(product.individualMinimumAmount).toFixed(18, 1);

      expect(finalized).to.be.true;
      expect(withdrawAmount).to.eq(expectedWithdraw);
    });

  });
})
