export interface NetworkMerge {
  _id: string;
  votes: string | number;
  disputes: string | number;
  prAddresses: string[];
  prAmounts: string[] | number[];
  proposalAddress: string;
}
