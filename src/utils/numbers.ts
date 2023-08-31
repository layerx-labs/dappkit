import BigNumber from 'bignumber.js';

const shiftByFixed = (value: string|number|BigNumber, shiftBy: number, rounding: number|null = null) =>
  new BigNumber(value).shiftedBy(shiftBy).toFixed(rounding ? 0 : null as any, rounding as any)

/**
 * convert a simple number into a big number representation, usually used to convert
 * to ERC20 token correct number
 * @param {string|number} value
 * @param {number} decimals
 * @param {number} rounding
 * @return {string}
 */
export function toSmartContractDecimals(value: string|number, decimals = 18, rounding:number|null = null) {
  return shiftByFixed(value, +decimals, rounding);
}

/**
 * convert a ERC20 token value into javascript number
 * @param {string|number|BigNumber} value
 * @param {number} decimals
 * @param {number} rounding
 * @return {string}
 */
export function fromSmartContractDecimals(value: string|number|BigNumber|bigint, decimals = 18, rounding: number|null = null) {
  return shiftByFixed(value.toString(), -(+decimals), rounding);
}

/**
 * @alias fromSmartContractDecimals
 * @param {string|number} value
 * @param {number} decimals
 * @return {string}
 */
export function fromDecimals(value: string|number|bigint, decimals = 18) {
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
  return +new Date(Number(date)*1000);
}
