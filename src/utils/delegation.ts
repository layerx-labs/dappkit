import {Delegation} from "@interfaces/delegation";
import {fromSmartContractDecimals} from "@utils/numbers";

export function delegationEntry({amount, ...rest}: Delegation, index: number, decimals = 18): Delegation {
  return ({...rest, id: index, amount: fromSmartContractDecimals(amount, decimals)})
}