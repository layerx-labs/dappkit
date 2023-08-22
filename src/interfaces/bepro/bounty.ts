import { Proposal } from "@interfaces/bepro/proposal";
import { Benefactor } from "@interfaces/bepro/benefactor";
import { PullRequest } from "@interfaces/bepro/pull-request";

export interface Bounty {
    id: number;
    creationDate: number;
    tokenAmount: string | number;

    creator: string;
    transactional: string;
    rewardToken: string;
    rewardAmount: string | number;
    fundingAmount: string | number;

    closed: boolean;
    canceled: boolean;
    funded: boolean;

    title: string;
    repoPath: string;
    branch: string;
    cid: string;
    githubUser: string;

    closedDate: number;

    pullRequests: PullRequest[];
    proposals: Proposal[];
    //benefactors: Benefactor[];
    funding: Benefactor[];
}