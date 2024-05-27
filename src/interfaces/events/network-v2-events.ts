export interface BountyCanceledEvent { returnValues: {'id': number;} }
export interface BountyClosedEvent { returnValues: {'id': number;} }
export interface BountyCreatedEvent { returnValues: {'id':string;'cid': string;'creator': string;} }
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
export interface OraclesTransferEvent { returnValues: {'from': string;'to': string; 'amount': number} }
export interface NetworkParamChanged { returnValues: { 'param': number; 'newvalue': number; 'oldvalue': number } }