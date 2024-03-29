import {ContractSendMethod} from 'web3-eth-contract';
import {ContractCallMethod} from '@methods/contract-call-method';

export interface Network_v2Methods {
  _governor(): ContractCallMethod<string>;
  _proposedGovernor(): ContractCallMethod<string>;
  bountiesIndex(): ContractCallMethod<number>;
  treasuryInfo(): ContractCallMethod<{'0': string, '1': number, '2': number}>;
  DIVISOR(): ContractCallMethod<number>;
  MAX_PERCENTAGE(): ContractCallMethod<number>;
  canceledBounties(): ContractCallMethod<number>;
  cidBountyId(v1: string): ContractCallMethod<number>;
  claimGovernor(): ContractSendMethod;
  closedBounties(): ContractCallMethod<number>;
  councilAmount(): ContractCallMethod<number>;
  disputableTime(): ContractCallMethod<number>;
  draftTime(): ContractCallMethod<number>;
  mergeCreatorFeeShare(): ContractCallMethod<number>;
  nftToken(): ContractCallMethod<string>;
  oracleExchangeRate(): ContractCallMethod<number>;
  oracles(v1: string): ContractCallMethod<{locked: number; toOthers: number; byOthers: number;}>;
  oraclesDistributed(): ContractCallMethod<number>;
  percentageNeededForDispute(): ContractCallMethod<number>;
  proposeGovernor(proposedGovernor: string): ContractSendMethod;
  proposerFeeShare(): ContractCallMethod<number>;
  networkToken(): ContractCallMethod<string>;
  totalNetworkToken(): ContractCallMethod<number>;
  getBounty(id: number): ContractCallMethod<{id: number; creationDate: number; tokenAmount: number; creator: string; transactional: string; rewardToken: string; rewardAmount: number; fundingAmount: number; closed: boolean; canceled: boolean; funded: boolean; title: string; repoPath: string; branch: string; cid: string; githubUser: string; closedDate: number; pullRequests: { originRepo: string; originCID: string; originBranch: string; userRepo: string; userBranch: string; ready: boolean; canceled: boolean; creator: string; cid: number; id: number; }[]; proposals: { id: number; creationDate: number; oracles: number; disputeWeight: number; prId: number; refusedByBountyOwner: boolean; creator: string; details: { recipient: string; percentage: number; }[] }[]; funding: { benefactor: string;amount: number;creationDate: number; }[];}>;
  disputes(address: string, bountyAndProposalIds: string): ContractCallMethod<number>;
  disputes(address: string, bountyId: string | number, proposalId: string | number): ContractCallMethod<number>;
  getDelegationsFor(_address: string): ContractCallMethod<{id: number; from: string; to: string; amount: number;}[]>;
  getBountiesOfAddress(owner: string): ContractCallMethod<number[]>;
  changeNetworkParameter(_parameter: number, _value: string | number): ContractSendMethod;
  updateTresuryAddress(_address: string): ContractSendMethod;
  manageOracles(lock: boolean, amount: string | number): ContractSendMethod;
  delegateOracles(amount: string | number, toAddress: string): ContractSendMethod;
  takeBackOracles(entryId: number): ContractSendMethod;
  openBounty(tokenAmount: string | number, transactional: string, rewardToken: string, rewardAmount: string | number, fundingAmount: string | number, cid: string, title: string, repoPath: string, branch: string, githubUser: string): ContractSendMethod;
  cancelBounty(id: number): ContractSendMethod;
  cancelFundRequest(id: number): ContractSendMethod;
  updateBountyAmount(id: number, newTokenAmount: string | number): ContractSendMethod;
  fundBounty(id: number, fundingAmount: string | number): ContractSendMethod;
  retractFunds(id: number, fundingId: number): ContractSendMethod;
  createPullRequest(forBountyId: number, originRepo: string, originBranch: string, originCID: string, userRepo: string, userBranch: string, cid: number): ContractSendMethod;
  cancelPullRequest(ofBounty: number, prId: number): ContractSendMethod;
  markPullRequestReadyForReview(bountyId: number, pullRequestId: number): ContractSendMethod;
  createBountyProposal(id: number, prId: number, recipients: string[], percentages: number[]): ContractSendMethod;
  disputeBountyProposal(bountyId: number, proposalId: number): ContractSendMethod;
  refuseBountyProposal(bountyId: number, proposalId: number): ContractSendMethod;
  closeBounty(id: number, proposalId: number, ipfsUri: string): ContractSendMethod;
  withdrawFundingReward(id: number, fundingId: number): ContractSendMethod;
  hardCancel(id: number): ContractSendMethod;
  cancelableTime(): ContractCallMethod<number>;
  registry(): ContractCallMethod<string>;
}