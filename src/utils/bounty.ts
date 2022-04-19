import { Bounty } from "@interfaces/bounty";

import { Thousand } from "@utils/constants";
import { fromDecimals } from "@utils/numbers";
import { ProposalParams, ProposalParser } from "@utils/proposal";
import { PullRequestParams, PullRequestParser } from "@utils/pull-request";
import { BenefactorParams, BenefactorParser } from "@utils/benefactor";

export interface BountyParams {
  '0': number;
  '1': number;
  '2': number;
  '3': string;
  '4': string;
  '5': string;
  '6': number;
  '7': number;
  '8': boolean;
  '9': boolean;
  '10': boolean;
  '11': string;
  '12': string;
  '13': string;
  '14': string;
  '15': string;
  '16': number;
  '17': PullRequestParams[];
  '18': ProposalParams[];
  '19': BenefactorParams[];
}

export function BountyParser({
  '0': id,
  '1': creationDate,
  '2': tokenAmount,
  '3': creator,
  '4': transactional,
  '5': rewardToken,
  '6': rewardAmount,
  '7': fundingAmount,
  '8': closed,
  '9': canceled,
  '10': funded,
  '11': title,
  '12': repoPath,
  '13': branch,
  '14': cid,
  '15': githubUser,
  '16': closedDate,
  '17': pullRequests,
  '18': proposals,
  '19': funding
}: BountyParams, networkTokenDecimals = 18, transactionalTokenDecimals = 18, rewardTokenDecimals = 18): Bounty {
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
    pullRequests: pullRequests.map(PullRequestParser),
    proposals: proposals.map(proposal => ProposalParser(proposal, networkTokenDecimals)),
    funding: funding.map(benefactor => BenefactorParser(benefactor, transactionalTokenDecimals))
  };
}