import { PullRequest } from "@interfaces/bepro/pull-request";

export function pullRequest({
  originRepo,
  originCID,
  originBranch,
  userRepo,
  userBranch,
  ready,
  canceled,
  creator,
  cid,
  id
}: PullRequest): PullRequest {
  return {
    originRepo,
    originCID,
    originBranch,
    userRepo,
    userBranch,
    ready,
    canceled,
    creator,
    cid: Number(cid),
    id: Number(id)
  };
}