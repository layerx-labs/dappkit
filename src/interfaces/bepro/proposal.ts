import { ProposalDetail } from "@interfaces/bepro/proposal-detail";

export interface Proposal {
    id: number;
    creationDate: number;
    oracles: string | number;
    disputeWeight: string | number;
    prId: number;
    refusedByBountyOwner: boolean;
    creator: string;

    details: ProposalDetail[]
}