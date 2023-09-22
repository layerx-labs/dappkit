import {fromDecimals} from '@utils/numbers';

interface Params {'0': number; '1': number; '2': number}
export function lockedTokensInfo(tokensInfo: Params, decimals = 18) {
  const [startDate, endDate, amount] = Object.values(tokensInfo);

  return {
    startDate: startDate * 1000,
    endDate: endDate * 1000,
    amount: fromDecimals(amount, decimals)
  }
}
