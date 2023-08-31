import { Benefactor } from "@interfaces/bepro/benefactor";
import { Thousand } from "./constants";
import { fromDecimals } from "./numbers";

export function benefactor({
  benefactor,
  amount,
  creationDate
} : Benefactor, transactionalTokenDecimals = 18): Benefactor {
  return {
    benefactor,
    amount: Number(fromDecimals(amount, transactionalTokenDecimals)),
    creationDate: Number(creationDate) * Thousand
  };
} 