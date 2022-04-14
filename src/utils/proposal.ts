import { Proposal } from "@interfaces/proposal";
import { ProposalDetailParams, ProposalDetailParser } from "@utils/proposal-detail";
import { Thousand } from "./constants";
import { fromDecimals } from "./numbers";

export interface ProposalParams {
  '0': number;
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': boolean;
  '6': string;
  '7': ProposalDetailParams[];
}

export function ProposalParser({
  '0': id,
  '1': creationDate,
  '2': oracles,
  '3': disputeWeight,
  '4': prId,
  '5': refusedByBountyOwner,
  '6': creator,
  '7': details
} : ProposalParams, decimals = 18): Proposal {
  return {
    id: +id,
    creationDate: creationDate * Thousand,
    oracles: +fromDecimals(oracles, decimals),
    disputeWeight: +fromDecimals(disputeWeight, decimals),
    prId: +prId,
    refusedByBountyOwner,
    creator,
    details: details.map(ProposalDetailParser)
  };
}