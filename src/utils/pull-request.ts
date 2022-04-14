import { PullRequest } from "@interfaces/pull-request";

export interface PullRequestParams {
  '0': string;
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  '5': boolean;
  '6': boolean;
  '7': string;
  '8': number;
  '9': number;
}

export function PullRequestParser({
  '0': originRepo,
  '1': originCID,
  '2': originBranch,
  '3': userRepo,
  '4': userBranch,
  '5': ready,
  '6': canceled,
  '7': creator,
  '8': cid,
  '9': id
}: PullRequestParams): PullRequest {
  return {
    originRepo,
    originCID,
    originBranch,
    userRepo,
    userBranch,
    ready,
    canceled,
    creator,
    cid: +cid,
    id: +id
  };
}