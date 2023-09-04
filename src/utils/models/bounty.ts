import { Bounty } from "@interfaces/bepro/bounty";
import { Thousand } from "@utils/constants";
import { fromDecimals } from "@utils/numbers";
import { proposal } from "@utils/models/proposal";
import { pullRequest } from "@utils/models/pull-request";
import { benefactor } from "@utils/models/benefactor";

export function bounty({
  creationDate,
  tokenAmount,
  rewardAmount,
  fundingAmount,
  closedDate,
  pullRequests,
  proposals,
  funding,
  ...rest
}: Bounty, networkTokenDecimals = 18, transactionalTokenDecimals = 18, rewardTokenDecimals = 18): Bounty {
  return {
    ...rest,
    creationDate: Number(creationDate) * Thousand,
    tokenAmount: Number(fromDecimals(tokenAmount, transactionalTokenDecimals)),
    rewardAmount: Number(fromDecimals(rewardAmount, rewardTokenDecimals)),
    fundingAmount: Number(fromDecimals(fundingAmount, transactionalTokenDecimals)),
    closedDate: Number(closedDate) * Thousand,
    pullRequests: pullRequests.map(pullRequest),
    proposals: proposals.map(bountyProposal => proposal(bountyProposal, networkTokenDecimals)),
    funding: funding.map(bountyBenefactor => benefactor(bountyBenefactor, transactionalTokenDecimals))
  };
}