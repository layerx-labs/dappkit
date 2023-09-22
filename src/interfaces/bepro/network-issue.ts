export interface NetworkIssue {
  _id: number;
  cid: string;
  issueGenerator: string;
  creationDate: number;
  tokensStaked: string | number;
  mergeProposalAmount: number;
  finalized: boolean;
  canceled: boolean;
  recognizedAsFinished: boolean
}
