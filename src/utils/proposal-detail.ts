import { ProposalDetail } from "@interfaces/bepro/proposal-detail";

export function proposalDetail({
  recipient,
  percentage
} : ProposalDetail): ProposalDetail {
  return {
    recipient,
    percentage: Number(percentage)
  };
}