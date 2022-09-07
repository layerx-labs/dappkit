import { Proposal } from "@interfaces/proposal";

import { Thousand } from "@utils/constants";
import { fromDecimals } from "@utils/numbers";
import { proposalDetail } from "@utils/proposal-detail";

export function proposal({
  id,
  creationDate,
  oracles,
  disputeWeight,
  prId,
  refusedByBountyOwner,
  creator,
  details
} : Proposal, decimals = 18): Proposal {
  return {
    id: +id,
    creationDate: creationDate * Thousand,
    oracles: fromDecimals(oracles, decimals),
    disputeWeight: fromDecimals(disputeWeight, decimals),
    prId: +prId,
    refusedByBountyOwner,
    creator,
    details: details.map(proposalDetail)
  };
}