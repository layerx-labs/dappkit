import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {BountyToken} from '@models/bepro/token/ERC721/bounty-token';
import {ERC20} from '@models/token/ERC20/erc20';
import {Governed} from '@base/governed';
import {fromSmartContractDecimals, toSmartContractDecimals} from '@utils/numbers';
import {nativeZeroAddress, Thousand} from '@utils/constants';
import {OraclesResume} from '@interfaces/bepro/oracles-resume';
import {Delegation} from '@interfaces/bepro/delegation';
import {oraclesResume} from '@utils/models/oracles-resume';
import {bounty} from '@utils/models/bounty';
import {treasuryInfo} from '@utils/models/treasury-info';
import {delegationEntry} from "@utils/models/delegation";
import {NetworkRegistry} from "@models/bepro/network-registry";
import BigNumber from "bignumber.js";
import artifact from "@interfaces/generated/abi/NetworkV2";
import {ContractConstructorArgs} from "web3-types";
import {Filter} from "web3";
import {Bounty} from "@interfaces/bepro/bounty";

export class Network_v2 extends Model<typeof artifact.abi> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
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
    cancelableTime: 7,
    proposerFeeShare: 8
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

    if (!this.contractAddress)
      return;

    const nftAddress = await this.nftTokenAddress();
    const transactionalTokenAddress = await this.networkTokenAddress();
    const registryAddress = await this.registryAddress();

    this._governed = new Governed(this.connection, this.contractAddress);
    this._networkToken = new ERC20(this.connection, transactionalTokenAddress);
    await this._networkToken.start();

    if (nftAddress !== nativeZeroAddress) {
      this._nftToken = new BountyToken(this.connection, nftAddress);
      await this._nftToken.start();
    }

    if (registryAddress !== nativeZeroAddress) {
      this._registry = new NetworkRegistry(this.connection, registryAddress);
      await this._registry.start();
    }

    this._DIVISOR = await this.getDivisor();
  }

  async deployJsonAbi(_oracleTokenAddress: string,
                      _registryAddress = nativeZeroAddress) {
    const deployOptions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: artifact.bytecode,
      arguments: [_oracleTokenAddress, _registryAddress] as ContractConstructorArgs<typeof artifact.abi>
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async getDivisor() {
    return Number(await this.callTx<bigint>(this.contract.methods.DIVISOR()));
  }

  async canceledBounties() {
    return Number(await this.callTx<bigint>(this.contract.methods.canceledBounties()));
  }

  async closedBounties() {
    return Number(await this.callTx<bigint>(this.contract.methods.closedBounties()));
  }

  async treasuryInfo() {
    return treasuryInfo(await this.callTx(this.contract.methods.treasuryInfo()), this.divisor);
  }

  // /**
  //  * Returns the number of open bounties
  //  */
  // async openBounties() {
  //   return await this.bountiesIndex() - (await this.closedBounties() + await this.canceledBounties());
  // }

  async councilAmount() {
    return fromSmartContractDecimals(await this.callTx(this.contract
                                                           .methods.councilAmount()), this.networkToken.decimals);
  }

  async oracleExchangeRate() {
    return Number(await this.callTx<bigint>(this.contract.methods.oracleExchangeRate())) / this.divisor;
  }

  /**
   * @returns number duration in milliseconds
   */
  async disputableTime() {
    return Number(await this.callTx<bigint>(this.contract.methods.disputableTime())) * Thousand;
  }

  /**
   * @returns number duration in milliseconds
   */
  async draftTime() {
    return Number(await this.callTx<bigint>(this.contract.methods.draftTime())) * Thousand;
  }

  async bountiesIndex() {
    return Number(await this.callTx<bigint>(this.contract.methods.bountiesIndex()));
  }

  async disputes(address: string, bountyId: string | number, proposalId: string | number) {
    const hash = this.connection.utils.keccak256(`${this.connection.utils.encodePacked(bountyId, proposalId)}`);
    
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.disputes(address, hash)), 
                                     this.networkToken.decimals);
  }

  async mergeCreatorFeeShare() {
    return Number(await this.callTx<bigint>(this.contract.methods.mergeCreatorFeeShare())) / this.divisor;
  }

  async proposerFeeShare() {
    return Number(await this.callTx<bigint>(this.contract.methods.proposerFeeShare())) / this.divisor;
  }

  async oraclesDistributed() {
    return fromSmartContractDecimals(await this.callTx<bigint>(this.contract.methods.oraclesDistributed()),
                                     this.networkToken.decimals);
  }

  async percentageNeededForDispute() {
    return Number(await this.callTx<bigint>(this.contract.methods.percentageNeededForDispute())) / this.divisor;
  }

  async networkTokenAddress() {
    return this.contract.methods.networkToken().call()
  }

  async registryAddress() {
    return this.contract.methods.registry().call();
  }

  async nftTokenAddress() {
    return this.contract.methods.nftToken().call();
  }

  async totalNetworkToken() {
    return fromSmartContractDecimals(await this.callTx(this.contract.methods.totalNetworkToken()),
                                     this.networkToken.decimals);
  }

  // async getBountiesOfAddress(_address: string) {
  //   return this.contract.methods.getBountiesOfAddress(_address).call();
  // }

  async getBounty(id: number) {
    const chainInformation: Bounty = await this.callTx(this.contract.methods.getBounty(id));

    if (!chainInformation)
      throw new Error(`No bounty with ${id}`);

    const transactional = new ERC20(this.connection, chainInformation.transactional);
    await transactional.start();

    const reward = chainInformation.rewardToken !== nativeZeroAddress ?
      new ERC20(this.connection, chainInformation.rewardToken) : null;

    await reward?.start();

    return bounty(chainInformation, this.networkToken.decimals, transactional.decimals, reward?.decimals);
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

    const amountNeededForDispute = 
      new BigNumber(oraclesDistributed).multipliedBy(percentageNeededForDispute).dividedBy(100);

    return  new BigNumber(disputeWeight).gte(amountNeededForDispute);
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
                                                                    this.toPercentage(percentageNeededForDispute)));
  }

  /**
   * @param mergeCreatorFeeShare percentage is per 10,000; 3 = 0,0003
   */
  async changeMergeCreatorFeeShare(mergeCreatorFeeShare: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.mergeCreatorFeeShare, 
                                                                    this.toPercentage(mergeCreatorFeeShare)));
  }

  /**
   * @param proposerFeeShare percentage is per 10,000; 3 = 0,0003
   */
  async changeProposerFeeShare(proposerFeeShare: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.proposerFeeShare, 
                                                                    this.toPercentage(proposerFeeShare)));
  }

  /**
   * @param oracleExchangeRate percentage is per 10,000; 3 = 0,0003
   */
  async changeOracleExchangeRate(oracleExchangeRate: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.oracleExchangeRate, 
                                                                    this.toPercentage(oracleExchangeRate)));
  }

  /**
   * Transforms a number to a percentage 
   * using the utils 'divisor' value.
   * 
   * @param percentage 
   * @returns 
   */
  toPercentage(percentage: number) {
    return percentage * this.divisor;
  }

  /**
   * @param value in seconds
   */
  async changeCancelableTime(value: number) {
    return this.sendTx(this.contract.methods.changeNetworkParameter(this.Params.cancelableTime, value));
  }

  async cancelableTime() {
    return (await this.callTx<number>(this.contract.methods.cancelableTime())) * Thousand;
  }

  /**
   * get total amount of oracles of an address
   */
  async getOraclesOf(_address: string) {
    const oracles = await this.callTx<{locked: number, byOthers: number}>(this.contract.methods.oracles(_address));
    const value = new BigNumber(oracles.locked).plus(new BigNumber(oracles.byOthers));
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
    const isFundingRequest = new BigNumber(fundingAmount).gt(0);
    const _transactional = new ERC20(this.connection, transactional);
    await _transactional.start();
    const _tokenAmount = toSmartContractDecimals(isFundingRequest ? 0 : tokenAmount, _transactional.decimals);
    const _fundingAmount = toSmartContractDecimals(fundingAmount, _transactional.decimals);

    if (rewardAmount && rewardToken !== nativeZeroAddress) {
      const rewardERC20 = new ERC20(this.connection, rewardToken);
      await rewardERC20.start();
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
    return this.sendTx(this.contract.methods.createPullRequest(BigInt(forBountyId),
                                                               originRepo,
                                                               originBranch,
                                                               originCID,
                                                               userRepo,
                                                               userBranch,
                                                               BigInt(cid)));
  }

  async cancelPullRequest(ofBounty: number, prId: number) {
    return this.sendTx(this.contract.methods.cancelPullRequest(ofBounty, prId));
  }

  /**
   * mark a PR ready for review
   */
  // async markPullRequestReadyForReview(bountyId: number, pullRequestId: number) {
  //   return this.sendTx(this.contract.methods.markPullRequestReadyForReview(bountyId, pullRequestId));
  // }

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
    return Number(await this.callTx<bigint>(this.contract.methods.cidBountyId(cid)));
  }

  async getDelegationsOf(address: string): Promise<Delegation[]> {
    return (await this.callTx<never[]>(this.contract.methods.getDelegationsFor(address)))
      .map((d, i) => delegationEntry(d, i, this.networkToken.decimals))
      .filter(({amount}) => new BigNumber(amount).gt(0));
  }

  async getBountyCanceledEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyCanceled`, filter)
  }

  async getBountyClosedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyClosed`, filter)
  }

  async getBountyCreatedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyCreated`, filter)
  }

  async getBountyProposalCreatedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyProposalCreated`, filter)
  }

  async getBountyProposalDisputedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyProposalDisputed`, filter)
  }

  async getBountyProposalRefusedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyProposalRefused`, filter)
  }

  async getBountyPullRequestCanceledEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyPullRequestCanceled`, filter)
  }

  async getBountyPullRequestCreatedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyPullRequestCreated`, filter)
  }

  async getBountyPullRequestReadyForReviewEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyPullRequestReadyForReview`, filter)
  }

  async getGovernorTransferredEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`GovernorTransferred`, filter)
  }

  async getBountyFundedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyFunded`, filter)
  }

  async getBountyAmountUpdatedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`BountyAmountUpdated`, filter)
  }
  
  async getOraclesChangedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`OraclesChanged`, filter)
  }
  
  async getOraclesTransferEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`OraclesTransfer`, filter)
  }

  async getNetworkParamChangedEvents(filter: Filter) {
    return this.contract.self.getPastEvents(`NetworkParamChanged`, filter)
  }

}
