import { Benefactor } from "@interfaces/benefactor";
import { Thousand } from "./constants";
import { fromDecimals } from "./numbers";

export function benefactor({
  benefactor,
  amount,
  creationDate
} : Benefactor, transactionalTokenDecimals = 18): Benefactor {
  return {
    benefactor,
    amount: +fromDecimals(amount, transactionalTokenDecimals),
    creationDate: +creationDate * Thousand
  };
} 