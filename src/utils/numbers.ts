import BigNumber from 'bignumber.js';

/**
 * convert a simple number into a big number representation, usually used to convert
 * to ERC20 token correct number
 * @param {string|number} value
 * @param {number} decimals
 * @return {number}
 */
export function toSmartContractDecimals(value: string|number, decimals = 18) {
  return new BigNumber(value).shiftedBy(+decimals).toFixed() as any as number;
}

/**
 * convert a ERC20 token value into javascript number
 * @param {string|number|BigNumber} value
 * @param {number} decimals
 * @return {number}
 */
export function fromSmartContractDecimals(value: string|number|BigNumber, decimals = 18) {
  return new BigNumber(value).shiftedBy(-(+decimals)).toNumber();
}

/**
 * @alias fromSmartContractDecimals
 * @param {string|number} value
 * @param {number} decimals
 * @return {number}
 */
export function fromDecimals(value: string|number, decimals = 18) {
  return fromSmartContractDecimals(value, decimals);
}

/**
 * converts a javascript date (ms) to a smart contract date (s)
 * @param {Date|number} date
 * @return {number}
 */
export function toSmartContractDate(date: number|Date) {
  return parseInt(`${+new Date(date) / 1000}`, 10).toFixed() as any as number;
}

/**
 * converts from a smart contract date (s) to javascript date (ms)
 * @param {number} date
 * @return {Date}
 */
export function fromSmartContractDate(date: number) {
  return +new Date(date*1000);
}
