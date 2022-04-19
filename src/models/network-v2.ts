import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import Network_v2Json from '@abi/Network_v2.json';
import {Network_v2Methods} from '@methods/network-v2';
import * as Events from '@events/network-v2-events';
import {XEvents, XPromiseEvent} from '@events/x-events';
import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';
import {BountyToken} from '@models/bounty-token';
import {ERC20} from '@models/erc20';
import {Governed} from '@base/governed';
import {fromSmartContractDecimals, toSmartContractDecimals} from '@utils/numbers';
import {nativeZeroAddress, TenK, Thousand} from '@utils/constants';
import { OraclesResume } from '@interfaces/oracles-resume';
import { Delegation } from '@interfaces/delegation';
import { oraclesResume } from '@utils/oracles-resume';
import { bounty } from '@utils/bounty';

export class Network_v2 extends Model<Network_v2Methods> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, readonly contractAddress?: string) {
    super(web3Connection, (Network_v2Json as any).abi as AbiItem[], contractAddress);
  }

  private _nftToken!: BountyToken;
  private _settlerToken!: ERC20;
  private _governed!: Governed;

  public Params = {
    councilAmount: 0,
    disputableTime: 1,
    draftTime: 2,
    oracleExchangeRate: 3,
    mergeCreatorFeeShare: 4,
    percentageNeededForDispute: 5
  }

  get nftToken() { return this._nftToken; }

  /**
   * Settler token is the token that originates oracles
   */
  get settlerToken() { return this._settlerToken; }

  /**
   * Access Governed contract functions through here
   */
  get governed() { return this._governed; }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async loadContract() {
    if (!this.contract)
      await super.loadContract();

    const nftAddress = await this.nftTokenAddress();
    const transactionalTokenAddress = await this.settlerTokenAddress();

    this._nftToken = new BountyToken(this.web3Connection, nftAddress);
    this._settlerToken = new ERC20(this.web3Connection, transactionalTokenAddress);

    this._governed = new Governed(this);

    await this._nftToken.loadContract();
    await this._settlerToken.loadContract();

  }

  async deployJsonAbi(_settlerToken: string,
                      _nftTokenAddress: string,
                      _bountyNftUri: string,
                      treasury = nativeZeroAddress,
                      cancelFee = 0,
                      closeFee = 0) {
    const deployOptions = {
      data: (Network_v2Json as any).bytecode,
      arguments: [_settlerToken, _nftTokenAddress, _bountyNftUri, treasury, cancelFee, closeFee]
    };

    return this.deploy(deployOptions, this.web3Connection.Account);
  }

  async bountyNftUri() {
    return this.callTx(this.contract.methods.bountyNftUri());
  }

  async canceledBounties() {
    return +(await this.callTx(this.contract.methods.canceledBounties()));
  }

  async closedBounties() {
    return +(await this.callTx(this.contract.methods.closedBounties()));
  }

  async treasuryInfo() {
    return this.callTx(this.contract.methods.treasuryInfo());
  }

  /**
   * Calculate the values that is distributed when a bounty is closed
   * @param bountyAmount bounty's value
   * @param proposalPercents an array with the percentuals of a proposal
   */
  async calculateDistributedAmounts(bountyAmount: number, proposalPercents: number[]) {
    const treasury = await this.treasuryInfo();

    const treasuryAmount = treasury['0'] === nativeZeroAddress ? 0 :  ((bountyAmount / 100) * (treasury['1'] / TenK));
    const mergerAmount = bountyAmount / 100 * await this.mergeCreatorFeeShare();
    const proposerAmount = (bountyAmount - mergerAmount) / 100 * await this.proposerFeeShare();
    const amount = bountyAmount - treasuryAmount - mergerAmount - proposerAmount;

    return {
      treasuryAmount,
      mergerAmount,
      proposerAmount,
      proposals: proposalPercents.map(percent => (amount / 100 * percent))
    };
  }

  /**
   * Returns the number of open bounties
   */
  async openBounties() {
    return await this.bountiesIndex() - (await this.closedBounties() + await this.canceledBounties());
  }

  async councilAmount() {
    return fromSmartContractDecimals(await this.callTx(this.contract
                                                           .methods.councilAmount()), this.settlerToken.decimals);
  }

  async oracleExchangeRate() {
    return (await this.callTx(this.contract.methods.oracleExchangeRate())) / TenK;
  }

  /**
   * @returns number duration in milliseconds
   */
  async disputableTime() {
    return (await this.callTx(this.contract.methods.disputableTime())) * Thousand;
  }

  /**
   * @returns number duration in milliseconds
   */
  async draftTime() {
    return (await this.callTx(this.contract.methods.draftTime())) * Thousand;
  }

  async bountiesIndex() {
    return +(await this.callTx(this.contract.methods.bountiesIndex()));
  }

  async disputes(address: string, bountyId: string | number, proposalId: string | number) {
    const hash = this.web3.utils.keccak256(`${this.web3.utils.encodePacked(bountyId, proposalId)}`);
    
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.disputes(address, hash)), 
                                     this.settlerToken.decimals);
  }

  async mergeCreatorFeeShare() {
    return (await this.callTx(this.contract.methods.mergeCreatorFeeShare())) / TenK;
  }

  async proposerFeeShare() {
    return (await this.callTx(this.contract.methods.proposerFeeShare())) / TenK;
  }

  async oraclesDistributed() {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.oraclesDistributed()), 
                                     this.settlerToken.decimals);
  }

  async percentageNeededForDispute() {
    return (await this.callTx(this.contract.methods.percentageNeededForDispute())) / TenK;
  }

  async settlerTokenAddress() {
    return this.callTx(this.contract.methods.settlerToken());
  }

  async nftTokenAddress() {
    return this.callTx(this.contract.methods.nftToken());
  }

  async totalSettlerLocked() {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalSettlerLocked()),
                                     this.settlerToken.decimals);
  }

  async getBountiesOfAddress(_address: string) {
    return this.callTx(this.contract.methods.getBountiesOfAddress(_address));
  }

  async getBounty(id: number) {
    return bounty(await this.callTx(this.contract.methods.getBounty(id)));
  }

  /**
   * A bounty is in Draft when now is earlier than the creation date + draft time
   * @param bountyId 
   * @returns boolean
   */
  async isBountyInDraft(bountyId: number) {
    const creationDate = (await this.getBounty(bountyId)).creationDate;

    return new Date() < new Date(creationDate + await this.draftTime());
  }

  /**
   * A proposal is disputed if its weight is greater than the percentage needed for dispute
   * @param bountyId 
   * @param proposalId 
   * @returns boolean
   */
  async isProposalDisputed(bountyId: number, proposalId: number) {
    const disputeWeight = (await this.getBounty(bountyId)).proposals[proposalId].disputeWeight;
    const oraclesDistributed = await this.oraclesDistributed();
    const percentageNeededForDispute = await this.percentageNeededForDispute();

    return disputeWeight >= (percentageNeededForDispute * oraclesDistributed / 100);
  }

  async changeCouncilAmount(newAmount: number) {
    newAmount = toSmartContractDecimals(newAmount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.councilAmount, newAmount));
  }

  /**
   * @param _draftTime duration in seconds
   */
  async changeDraftTime(_draftTime: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.draftTime, _draftTime));
  }

  /**
   * @param disputableTime duration in seconds
   */
  async changeDisputableTime(disputableTime: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.disputableTime, disputableTime));
  }

  /**
   * @param percentageNeededForDispute percentage is per 10,000; 3 = 0,0003
   */
  async changePercentageNeededForDispute(percentageNeededForDispute: number) {
    return this.sendTx(this.contract.methods
                           .changeNetworkParameter(this.Params.percentageNeededForDispute, percentageNeededForDispute));
  }

  /**
   * @param mergeCreatorFeeShare percentage is per 10,000; 3 = 0,0003
   */
  async changeMergeCreatorFeeShare(mergeCreatorFeeShare: number) {
    return this.sendTx(this.contract.methods
                           .changeNetworkParameter(this.Params.mergeCreatorFeeShare, mergeCreatorFeeShare));
  }

  /**
   * @param oracleExchangeRate percentage is per 10,000; 3 = 0,0003
   */
  async changeOracleExchangeRate(oracleExchangeRate: number) {
    return this.sendTx(this.contract.methods
                           .changeNetworkParameter(this.Params.oracleExchangeRate, oracleExchangeRate));
  }


  /**
   * get total amount of oracles of an address
   */
  async getOraclesOf(_address: string) {
    const oracles = await this.callTx(this.contract.methods.oracles(_address));
    return fromSmartContractDecimals(+oracles.locked + +oracles.byOthers, this.settlerToken.decimals);
  }

  /**
   * Get the resume of oracles locked, delegated by others and delegations
   * @param address 
   */
  async getOraclesResume(address: string): Promise<OraclesResume> {
    return oraclesResume( await this.callTx(this.contract.methods.oracles(address)), 
                          await this.getDelegationsOf(address), 
                          this.settlerToken.decimals );
  }

  /**
   * Lock given amount into the oracle mapping
   */
  async lock(tokenAmount: number) {
    tokenAmount = toSmartContractDecimals(tokenAmount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.manageOracles(true, tokenAmount));
  }

  /**
   * Unlock from the oracle mapping
   */
  async unlock(tokenAmount: number) {
    tokenAmount = toSmartContractDecimals(tokenAmount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.manageOracles(false, tokenAmount));
  }

  /**
   * Gives oracles from msg.sender to recipient
   */
  async delegateOracles(tokenAmount: number, recipient: string) {
    tokenAmount = toSmartContractDecimals(tokenAmount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.delegateOracles(tokenAmount, recipient));
  }

  /**
   * Takes back oracles from the entryId related to msg.sender
   */
  async takeBackOracles(entryId: number) {
    return this.sendTx(this.contract.methods.takeBackOracles(entryId));
  }

  /**
   * Creates a bounty on the network
   * You can open a funding-request-bounty by providing `rewardToken`, `rewardAmount`, and `fundingAmount`
   *
   * @param {number} [tokenAmount=0] the value of this bounty (ignored if funding)
   * @param {string} [transactional=0x0000000000000000000000000000000000000000] the token address of the ERC20 used for paying for this bounty
   * @param {string} [rewardToken=0x0000000000000000000000000000000000000000] reward token address in case of funding
   * @param {number} [rewardAmount=0] reward amount in case of funding; this value will be shared by all benefactors based on their percentage of funding and chosen ratio
   * @param {number} [fundingAmount=0] requested funding amount (in transactional ERC20)
   * @param {string} cid custom id of this bounty
   * @param {string} title title for this bounty
   * @param {string} repoPath repository path for this bounty
   * @param {string} branch branch inside the provided repo path
   */
  async openBounty(tokenAmount = 0,
                   transactional = nativeZeroAddress,
                   rewardToken = nativeZeroAddress,
                   rewardAmount = 0,
                   fundingAmount = 0,
                   cid: string,
                   title: string,
                   repoPath: string,
                   branch: string,
                   githubUser: string) {

    let _rewardAmount = 0;
    let _fundingAmount = 0;

    const _transactional = new ERC20(this.web3Connection, transactional);
    await _transactional.loadContract();
    const _tokenAmount = toSmartContractDecimals(tokenAmount, _transactional.decimals);

    if (rewardAmount && rewardToken !== nativeZeroAddress) {
      const rewardERC20 = new ERC20(this.web3Connection, rewardToken);
      await rewardERC20.loadContract();
      _rewardAmount = toSmartContractDecimals(rewardAmount, rewardERC20.decimals);
      _fundingAmount = toSmartContractDecimals(fundingAmount, _transactional.decimals);
    }

    return this.sendTx(this.contract.methods.openBounty(_tokenAmount,
                                                        transactional,
                                                        rewardToken,
                                                        _rewardAmount,
                                                        _fundingAmount,
                                                        cid,
                                                        title,
                                                        repoPath,
                                                        branch,
                                                        githubUser));
  }

  // /**
  //  * user adds value to an existing bounty
  //  * @param id bounty id
  //  * @param tokenAmount amount to add as support
  //  * @param decimals decimals of the transactional for this bounty
  //  */
  // async supportBounty(id: number, tokenAmount: number, decimals = 18) {
  //   tokenAmount = toSmartContractDecimals(tokenAmount, decimals);
  //   return this.sendTx(this.contract.methods.supportBounty(id, tokenAmount));
  // }

  // /**
  //  * user removes its beneficiary entry
  //  * @param bountyId
  //  * @param entryId
  //  */
  // async retractSupportFromBounty(bountyId: number, entryId: number) {
  //   return this.sendTx(this.contract.methods.retractSupportFromBounty(bountyId, entryId));
  // }

  /**
   * cancel a bounty
   */
  async cancelBounty(id: number) {
    return this.sendTx(this.contract.methods.cancelBounty(id));
  }

  /**
   * cancel funding
   */
  async cancelFundRequest(id: number) {
    return this.sendTx(this.contract.methods.cancelFundRequest(id));
  }

  /**
   * update the value of a bounty with a new amount
   * @param {number} id
   * @param {number} newTokenAmount
   * @param {number} decimals decimals of the transactional for this bounty
   */
  async updateBountyAmount(id: number, newTokenAmount: number, decimals = 18) {
    newTokenAmount = toSmartContractDecimals(newTokenAmount, decimals);
    return this.sendTx(this.contract.methods.updateBountyAmount(id, newTokenAmount));
  }

  /**
   * enable users to fund a bounty
   * @param {number} id
   * @param {number} fundingAmount
   * @param {number} decimals decimals of the transactional for this bounty
   */
  async fundBounty(id: number, fundingAmount: number, decimals = 18) {
    fundingAmount = toSmartContractDecimals(fundingAmount, decimals);
    return this.sendTx(this.contract.methods.fundBounty(id, fundingAmount));
  }

  /**
   * enable users to retract their funding
   */
  async retractFunds(id: number, fundingIds: number[]) {
    return this.sendTx(this.contract.methods.retractFunds(id, fundingIds));
  }

  /**
   * create pull request for bounty id
   */
  async createPullRequest(forBountyId: number,
                          originRepo: string,
                          originBranch: string,
                          originCID: string,
                          userRepo: string,
                          userBranch: string,
                          cid: number) {
    return this.sendTx(this.contract.methods.createPullRequest(forBountyId,
                                                               originRepo,
                                                               originBranch,
                                                               originCID,
                                                               userRepo,
                                                               userBranch,
                                                               cid));
  }

  async cancelPullRequest(ofBounty: number, prId: number) {
    return this.sendTx(this.contract.methods.cancelPullRequest(ofBounty, prId));
  }

  /**
   * mark a PR ready for review
   */
  async markPullRequestReadyForReview(bountyId: number, pullRequestId: number) {
    return this.sendTx(this.contract.methods.markPullRequestReadyForReview(bountyId, pullRequestId));
  }

  /**
   * create a proposal with a pull request for a bounty
   */
  async createBountyProposal(id: number, prId: number, recipients: string[], percentages: number[]) {
    return this.sendTx(this.contract.methods.createBountyProposal(id, prId, recipients, percentages));
  }

  /**
   * dispute a proposal for a bounty
   */
  async disputeBountyProposal(bountyId: number, proposalId: number) {
    return this.sendTx(this.contract.methods.disputeBountyProposal(bountyId, proposalId));
  }

  async refuseBountyProposal(bountyId: number, proposalId: number) {
    return this.sendTx(this.contract.methods.refuseBountyProposal(bountyId, proposalId));
  }

  /**
   * close bounty with the selected proposal id
   */
  async closeBounty(id: number, proposalId: number) {
    return this.sendTx(this.contract.methods.closeBounty(id, proposalId));
  }

  async cidBountyId(cid: string) {
    return this.callTx(this.contract.methods.cidBountyId(cid));
  }

  async getDelegationsOf(address: string): Promise<Delegation[]> {
    const delegations = await this.callTx(this.contract.methods.getDelegationsFor(address));
    const mappedDelegations = delegations.map((delegation, index) => ({
      ...delegation,
      id: index,
      amount: fromSmartContractDecimals(delegation.amount, this.settlerToken.decimals)
    }));

    return mappedDelegations.filter(delegation => delegation.amount > 0);
  }

  async getBountyCanceledEvents(filter: PastEventOptions): Promise<XEvents<Events.BountyCanceledEvent>[]> {
    return this.contract.self.getPastEvents(`BountyCanceled`, filter)
  }

  async getBountyClosedEvents(filter: PastEventOptions): Promise<XEvents<Events.BountyClosedEvent>[]> {
    return this.contract.self.getPastEvents(`BountyClosed`, filter)
  }

  async getBountyCreatedEvents(filter: PastEventOptions): Promise<XEvents<Events.BountyCreatedEvent>[]> {
    return this.contract.self.getPastEvents(`BountyCreated`, filter)
  }

  async getBountyDistributedEvents(filter: PastEventOptions): Promise<XEvents<Events.BountyDistributedEvent>[]> {
    return this.contract.self.getPastEvents(`BountyDistributed`, filter)
  }

  async getBountyProposalCreatedEvents(filter: PastEventOptions): XPromiseEvent<Events.BountyProposalCreatedEvent> {
    return this.contract.self.getPastEvents(`BountyProposalCreated`, filter)
  }

  async getBountyProposalDisputedEvents(filter: PastEventOptions): XPromiseEvent<Events.BountyProposalDisputedEvent> {
    return this.contract.self.getPastEvents(`BountyProposalDisputed`, filter)
  }

  async getBountyProposalRefusedEvents(filter: PastEventOptions): XPromiseEvent<Events.BountyProposalRefusedEvent> {
    return this.contract.self.getPastEvents(`BountyProposalRefused`, filter)
  }

  /* eslint-disable max-len */
  async getBountyPullRequestCanceledEvents(filter: PastEventOptions): XPromiseEvent<Events.BountyPullRequestCanceledEvent> {
    return this.contract.self.getPastEvents(`BountyPullRequestCanceled`, filter)
  }

  async getBountyPullRequestCreatedEvents(filter: PastEventOptions): XPromiseEvent<Events.BountyPullRequestCreatedEvent> {
    return this.contract.self.getPastEvents(`BountyPullRequestCreated`, filter)
  }

  async getBountyPullRequestReadyForReviewEvents(filter: PastEventOptions): XPromiseEvent<Events.BountyPullRequestReadyForReviewEvent> {
    return this.contract.self.getPastEvents(`BountyPullRequestReadyForReview`, filter)
  }
  /* eslint-enable max-len */

  async getGovernorTransferredEvents(filter: PastEventOptions): Promise<XEvents<Events.GovernorTransferredEvent>[]> {
    return this.contract.self.getPastEvents(`GovernorTransferred`, filter)
  }

}
