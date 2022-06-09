import { TenK } from "./constants";

export interface TreasuryInfoParams { 
  "0": string; 
  "1": number; 
  "2": number; 
}

export function treasuryInfo({
  "0": treasury,
  "1": closeFee,
  "2": cancelFee
}: TreasuryInfoParams) {
  return {
    treasury,
    closeFee: +closeFee / TenK,
    cancelFee: +cancelFee / TenK,
  };
}