import { Benefactor } from "@interfaces/benefactor";
import { Thousand } from "./constants";
import { fromDecimals } from "./numbers";

export interface BenefactorParams {
  '0': string;
  '1': number;
  '2': number;
}

export function BenefactorParser({
  '0': benefactor,
  '1': amount,
  '2': creationDate
} : BenefactorParams, transactionalTokenDecimals = 18): Benefactor {
  return {
    benefactor,
    amount: +fromDecimals(amount, transactionalTokenDecimals),
    creationDate: +creationDate * Thousand
  };
} 