/* eslint-disable max-len */
export interface BountyCanceledEvent { returnValues: {'id': number;} }
export interface BountyClosedEvent { returnValues: {'id': number;} }
export interface BountyCreatedEvent { returnValues: {'cid': string;'creator': string;'amount': number;} }
export interface BountyProposalCreatedEvent { returnValues: {'bountyId': number;'prId': number;'proposalId': number;} }
export interface BountyProposalDisputedEvent { returnValues: {'bountyId': number;'prId': number;'proposalId': number;} }
export interface BountyProposalRefusedEvent { returnValues: {'bountyId': number;'prId': number;'proposalId': number;} }
export interface BountyPullRequestCanceledEvent { returnValues: {'bountyId': number;'pullRequestId': number;} }
export interface BountyPullRequestCreatedEvent { returnValues: {'bountyId': number;'pullRequestId': number;} }
export interface BountyPullRequestReadyForReviewEvent { returnValues: {'bountyId': number;'pullRequestId': number;} }
export interface GovernorTransferredEvent { returnValues: {'previousGovernor': string;'newGovernor': string;} }
export interface BountyFunded { returnValues: {'id': string;'funded': boolean;} }
export interface BountyAmountUpdatedEvent { returnValues: {'id': number;'amount': number;} }
export interface OraclesChangedEvent { returnValues: {'actor': string;'actionAmount': number; 'newLockedTotal': number} }