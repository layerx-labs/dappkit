import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import Network_v2Json from '@abi/NetworkV2.json';
import {Network_v2Methods} from '@methods/network-v2';
import * as Events from '@events/network-v2-events';
import {XEvents, XPromiseEvent} from '@events/x-events';
import {PastEventOptions} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';
import {BountyToken} from '@models/bounty-token';
import {ERC20} from '@models/erc20';
import {Governed} from '@base/governed';
import {fromSmartContractDecimals, toSmartContractDecimals} from '@utils/numbers';
import {nativeZeroAddress, Thousand} from '@utils/constants';
import { OraclesResume } from '@interfaces/oracles-resume';
import { Delegation } from '@interfaces/delegation';
import { oraclesResume } from '@utils/oracles-resume';
import { bounty } from '@utils/bounty';
import { treasuryInfo } from '@utils/treasury-info';
import {delegationEntry} from "@utils/delegation";
import {NetworkRegistry} from "@models/network-registry";
import BigNumber from "bignumber.js";

export class Network_v2 extends Model<Network_v2Methods> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, readonly contractAddress?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(web3Connection, (Network_v2Json as any).abi as AbiItem[], contractAddress);
  }

  private _nftToken!: BountyToken;
  private _networkToken!: ERC20;
  private _governed!: Governed;
  private _registry!: NetworkRegistry;
  private _DIVISOR!: number;

  public Params = {
    councilAmount: 0,
    disputableTime: 1,
    draftTime: 2,
    oracleExchangeRate: 3,
    mergeCreatorFeeShare: 4,
    percentageNeededForDispute: 5,
    cancelableTime: 7
  }

  get nftToken() { return this._nftToken; }

  /**
   * Settler token is the token that originates oracles
   */
  get networkToken() { return this._networkToken; }

  /**
   * Access Governed contract functions through here
   */
  get governed() { return this._governed; }

  /**
   * Access registry for this network, in case one exists
   */
  get registry() { return this._registry }

  get divisor() { return this._DIVISOR; }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async loadContract() {
    if (!this.contract)
      await super.loadContract();

    const nftAddress = await this.nftTokenAddress();
    const transactionalTokenAddress = await this.networkTokenAddress();
    const registryAddress = await this.registryAddress();

    this._governed = new Governed(this);
    this._networkToken = new ERC20(this.connection, transactionalTokenAddress);
    await this._networkToken.loadContract();

    if (nftAddress && nftAddress !== nativeZeroAddress) {
      this._nftToken = new BountyToken(this.connection, nftAddress);
      await this._nftToken.loadContract();
    }

    if (registryAddress !== nativeZeroAddress) {
      this._registry = new NetworkRegistry(this.connection, registryAddress);
      await this._registry.loadContract();
    }

    this._DIVISOR = await this.getDivisor();

  }

  async deployJsonAbi(_oracleTokenAddress: string,
                      _registryAddress = nativeZeroAddress) {
    const deployOptions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (Network_v2Json as any).bytecode,
      arguments: [_oracleTokenAddress, _registryAddress]
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async getDivisor() {
    return this.callTx(this.contract.methods.DIVISOR());
  }

  async canceledBounties() {
    return +(await this.callTx(this.contract.methods.canceledBounties()));
  }

  async closedBounties() {
    return +(await this.callTx(this.contract.methods.closedBounties()));
  }

  async treasuryInfo() {
    return treasuryInfo(await this.callTx(this.contract.methods.treasuryInfo()), this.divisor);
  }

  /**
   * Returns the number of open bounties
   */
  async openBounties() {
    return await this.bountiesIndex() - (await this.closedBounties() + await this.canceledBounties());
  }

  async councilAmount() {
    return fromSmartContractDecimals(await this.callTx(this.contract
                                                           .methods.councilAmount()), this.networkToken.decimals);
  }

  async oracleExchangeRate() {
    return (await this.callTx(this.contract.methods.oracleExchangeRate())) / this.divisor;
  }

  /**
   * @returns number duration in milliseconds
   */
  async disputableTime() {
    return +(await this.callTx(this.contract.methods.disputableTime())) * Thousand;
  }

  /**
   * @returns number duration in milliseconds
   */
  async draftTime() {
    return +(await this.callTx(this.contract.methods.draftTime())) * Thousand;
  }

  async bountiesIndex() {
    return +(await this.callTx(this.contract.methods.bountiesIndex()));
  }

  async disputes(address: string, bountyId: string | number, proposalId: string | number) {
    const hash = this.web3.utils.keccak256(`${this.web3.utils.encodePacked(bountyId, proposalId)}`);
    
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.disputes(address, hash)), 
                                     this.networkToken.decimals);
  }

  async mergeCreatorFeeShare() {
    return (await this.callTx(this.contract.methods.mergeCreatorFeeShare())) / this.divisor;
  }

  async proposerFeeShare() {
    return (await this.callTx(this.contract.methods.proposerFeeShare())) / this.divisor;
  }

  async oraclesDistributed() {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.oraclesDistributed()), 
                                     this.networkToken.decimals);
  }

  async percentageNeededForDispute() {
    return (await this.callTx(this.contract.methods.percentageNeededForDispute())) / this.divisor;
  }

  async networkTokenAddress() {
    return this.callTx(this.contract.methods.networkToken());
  }

  async registryAddress() {
    return this.callTx(this.contract.methods.registry());
  }

  async nftTokenAddress() {
    return this.callTx(this.contract.methods.nftToken());
  }

  async totalNetworkToken() {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalNetworkToken()),
                                     this.networkToken.decimals);
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

    return disputeWeight >= (percentageNeededForDispute * +oraclesDistributed / 100);
  }

  async changeCouncilAmount(newAmount: string | number) {
    newAmount = toSmartContractDecimals(newAmount, this.networkToken.decimals);
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
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.percentageNeededForDispute, 
                                                                    percentageNeededForDispute * this.divisor));
  }

  /**
   * @param mergeCreatorFeeShare percentage is per 10,000; 3 = 0,0003
   */
  async changeMergeCreatorFeeShare(mergeCreatorFeeShare: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.mergeCreatorFeeShare, 
                                                                    mergeCreatorFeeShare * this.divisor));
  }

  /**
   * @param oracleExchangeRate percentage is per 10,000; 3 = 0,0003
   */
  async changeOracleExchangeRate(oracleExchangeRate: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.oracleExchangeRate, 
                                                                    oracleExchangeRate * this.divisor));
  }

  /**
   * @param value in seconds
   */
  async changeCancelableTime(value: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.cancelableTime, value));
  }

  async cancelableTime() {
    return (await this.callTx(this.contract.methods.cancelableTime())) * Thousand;
  }

   /**
   * update the treasury address
   * @param _address 
   */
  async updateTresuryAddress(_address: string) {
    return this.sendTx(this.contract.methods.updateTresuryAddress(_address));
  }

  /**
   * get total amount of oracles of an address
   */
  async getOraclesOf(_address: string) {
    const oracles = await this.callTx(this.contract.methods.oracles(_address));
    const value = BigNumber(oracles.locked).plus(BigNumber(oracles.byOthers));
    return fromSmartContractDecimals(value, this.networkToken.decimals);
  }

  /**
   * Get the resume of oracles locked, delegated by others and delegations
   * @param address 
   */
  async getOraclesResume(address: string): Promise<OraclesResume> {
    return oraclesResume( await this.callTx(this.contract.methods.oracles(address)), 
                          await this.getDelegationsOf(address), 
                          this.networkToken.decimals );
  }

  /**
   * Lock given amount into the oracle mapping
   */
  async lock(tokenAmount: string | number) {
    tokenAmount = toSmartContractDecimals(tokenAmount, this.networkToken.decimals);
    return this.sendTx(this.contract.methods.manageOracles(true, tokenAmount));
  }

  /**
   * Unlock from the oracle mapping
   */
  async unlock(tokenAmount: string | number) {
    tokenAmount = toSmartContractDecimals(tokenAmount, this.networkToken.decimals);
    return this.sendTx(this.contract.methods.manageOracles(false, tokenAmount));
  }

  /**
   * Gives oracles from msg.sender to recipient
   */
  async delegateOracles(tokenAmount: string | number, recipient: string) {
    tokenAmount = toSmartContractDecimals(tokenAmount, this.networkToken.decimals);
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
   * @param {string} githubUser
   */
  async openBounty(tokenAmount = 0 as string | number,
                   transactional = nativeZeroAddress,
                   rewardToken = nativeZeroAddress,
                   rewardAmount = 0 as string | number,
                   fundingAmount = 0 as string | number,
                   cid: string,
                   title: string,
                   repoPath: string,
                   branch: string,
                   githubUser: string) {

    let _rewardAmount = 0 as string | number;
    const _transactional = new ERC20(this.connection, transactional);
    await _transactional.loadContract();
    const _tokenAmount = toSmartContractDecimals(fundingAmount > 0 ? 0 : tokenAmount, _transactional.decimals)
    const _fundingAmount = toSmartContractDecimals(fundingAmount, _transactional.decimals)

    if (rewardAmount && rewardToken !== nativeZeroAddress) {
      const rewardERC20 = new ERC20(this.connection, rewardToken);
      await rewardERC20.loadContract();
      _rewardAmount = toSmartContractDecimals(rewardAmount, rewardERC20.decimals);
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
   * cancels a bounty or a funding request if user is governor or owner
   * and after cancelableTime has passed
   * @param id bounty or funding request id
   */
  async hardCancel(id: number) {
    return this.sendTx(this.contract.methods.hardCancel(id));
  }

  /**
   * update the value of a bounty with a new amount
   * @param {number} id
   * @param {number} newTokenAmount
   * @param {number} decimals decimals of the transactional for this bounty
   */
  async updateBountyAmount(id: number, newTokenAmount: string | number, decimals = 18) {
    newTokenAmount = toSmartContractDecimals(newTokenAmount, decimals);
    return this.sendTx(this.contract.methods.updateBountyAmount(id, newTokenAmount));
  }

  /**
   * enable users to fund a bounty
   * @param {number} id
   * @param {number} fundingAmount
   * @param {number} decimals decimals of the transactional for this bounty
   */
  async fundBounty(id: number, fundingAmount: string | number, decimals = 18) {
    fundingAmount = toSmartContractDecimals(fundingAmount, decimals);
    return this.sendTx(this.contract.methods.fundBounty(id, fundingAmount));
  }

  /**
   * enable users to retract their funding
   */
  async retractFunds(id: number, fundingId: number) {
    return this.sendTx(this.contract.methods.retractFunds(id, fundingId));
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
  async closeBounty(id: number, proposalId: number, ipfsUri = "") {
    return this.sendTx(this.contract.methods.closeBounty(id, proposalId, ipfsUri));
  }

  async withdrawFundingReward(id: number, fundingId: number) {
    return this.sendTx(this.contract.methods.withdrawFundingReward(id, fundingId));
  }

  async cidBountyId(cid: string) {
    return this.callTx(this.contract.methods.cidBountyId(cid));
  }

  async getDelegationsOf(address: string): Promise<Delegation[]> {
    return (await this.callTx(this.contract.methods.getDelegationsFor(address)))
      .map((d, i) => delegationEntry(d, i, this.networkToken.decimals))
      .filter(({amount}) => amount > 0);
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

  async getBountyFundedEvents(filter: PastEventOptions): Promise<XEvents<Events.GovernorTransferredEvent>[]> {
    return this.contract.self.getPastEvents(`BountyFunded`, filter)
  }

  async getBountyAmountUpdatedEvents(filter: PastEventOptions): Promise<XEvents<Events.BountyAmountUpdatedEvent>[]> {
    return this.contract.self.getPastEvents(`BountyAmountUpdated`, filter)
  }
  
  async getOraclesChangedEvents(filter: PastEventOptions): Promise<XEvents<Events.OraclesChangedEvent>[]> {
    return this.contract.self.getPastEvents(`OraclesChanged`, filter)
  }
  
  async getOraclesTransferEvents(filter: PastEventOptions): Promise<XEvents<Events.OraclesTransferEvent>[]> {
    return this.contract.self.getPastEvents(`OraclesTransfer`, filter)
  }

}
