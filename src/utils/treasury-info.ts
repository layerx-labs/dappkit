import { TenK } from "./constants";

export function treasuryInfo({
  "0": treasury,
  "1": closeFee,
  "2": cancelFee
}: { "0": string; "1": number; "2": number; }) {
  return {
    treasury,
    closeFee: +closeFee / TenK,
    cancelFee: +cancelFee / TenK,
  };
}