export interface StakingProduct {
  _id: number;
  createdAt: number;
  startDate: number;
  endDate:  number;
  totalMaxAmount: string | number;
  individualMinimumAmount: string | number;
  individualMaxAmount: string | number;
  currentAmount: string | number;
  APR: number;
  lockedUntilFinalization: boolean;
  subscribers: string[];
  subscriptionIds: number[];
}
