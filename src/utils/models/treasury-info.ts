export interface TreasuryInfoParams {
  "0": string; 
  "1": number; 
  "2": number; 
}

export function treasuryInfo({
  "0": treasury,
  "1": closeFee,
  "2": cancelFee
}: TreasuryInfoParams, divisor = 1) {
  return {
    treasury,
    closeFee: +closeFee / divisor,
    cancelFee: +cancelFee / divisor,
  };
}