import { Bounty } from "@interfaces/bounty";
import { Thousand } from "@utils/constants";
import { fromDecimals } from "@utils/numbers";
import { proposal } from "@utils/proposal";
import { pullRequest } from "@utils/pull-request";
import { benefactor } from "@utils/benefactor";

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
    creationDate: +creationDate * Thousand,
    tokenAmount: +fromDecimals(tokenAmount, transactionalTokenDecimals),
    rewardAmount: +fromDecimals(rewardAmount, rewardTokenDecimals),
    fundingAmount: +fromDecimals(fundingAmount, transactionalTokenDecimals),
    closedDate: +closedDate * Thousand,
    pullRequests: pullRequests.map(pullRequest),
    proposals: proposals.map(bountyProposal => proposal(bountyProposal, networkTokenDecimals)),
    funding: funding.map(bountyBenefactor => benefactor(bountyBenefactor, transactionalTokenDecimals))
  };
}