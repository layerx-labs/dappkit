import { ProposalDetail } from "@interfaces/proposal-detail";

export function proposalDetail({
  recipient,
  percentage
} : ProposalDetail): ProposalDetail {
  return {
    recipient,
    percentage: +percentage
  };
}