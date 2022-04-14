import { ProposalDetail } from "@interfaces/proposal-detail";

export interface ProposalDetailParams {
  '0': string;
  '1': number;
}

export function ProposalDetailParser({
  '0': recipient,
  '1': percentage
} : ProposalDetailParams): ProposalDetail {
  return {
    recipient,
    percentage: +percentage
  };
}