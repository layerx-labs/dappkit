import { Proposal } from "@interfaces/bepro/proposal";

import { Thousand } from "@utils/constants";
import { fromDecimals } from "@utils/numbers";
import { proposalDetail } from "@utils/models/proposal-detail";

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
    id: Number(id),
    creationDate: Number(creationDate) * Thousand,
    oracles: Number(fromDecimals(oracles, decimals)),
    disputeWeight: Number(fromDecimals(disputeWeight, decimals)),
    prId: Number(prId),
    refusedByBountyOwner,
    creator,
    details: details.map(proposalDetail)
  };
}