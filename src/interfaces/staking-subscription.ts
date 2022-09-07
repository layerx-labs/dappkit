export interface StakingSubscription {
  _id: number;
  productId: number;
  startDate: number;
  endDate: number;
  amount: string | number;
  subscriberAddress: string;
  APR: number;
  finalized: boolean;
  withdrawAmount: string | number;
}
