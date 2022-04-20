import { Bounty } from "@interfaces/bounty";

import { Thousand } from "@utils/constants";
import { fromDecimals } from "@utils/numbers";
import { proposal } from "@utils/proposal";
import { pullRequest } from "@utils/pull-request";
import { benefactor } from "@utils/benefactor";

export function bounty({
  id,
  creationDate,
  tokenAmount,
  creator,
  transactional,
  rewardToken,
  rewardAmount,
  fundingAmount,
  closed,
  canceled,
  funded,
  title,
  repoPath,
  branch,
  cid,
  githubUser,
  closedDate,
  pullRequests,
  proposals,
  funding
}: Bounty, networkTokenDecimals = 18, transactionalTokenDecimals = 18, rewardTokenDecimals = 18): Bounty {
  return {
    id,
    creationDate: +creationDate * Thousand,
    tokenAmount: +fromDecimals(tokenAmount, transactionalTokenDecimals),
    creator,
    transactional,
    rewardToken,
    rewardAmount: +fromDecimals(rewardAmount, rewardTokenDecimals),
    fundingAmount: +fromDecimals(fundingAmount, transactionalTokenDecimals),
    closed,
    canceled,
    funded,
    title,
    repoPath,
    branch,
    cid,
    githubUser,
    closedDate: +closedDate * Thousand,
    pullRequests: pullRequests.map(pullRequest),
    proposals: proposals.map(bountyProposal => proposal(bountyProposal, networkTokenDecimals)),
    funding: funding.map(bountyBenefactor => benefactor(bountyBenefactor, transactionalTokenDecimals))
  };
}