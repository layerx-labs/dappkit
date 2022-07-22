import {nativeZeroAddress} from "@utils/constants";

interface Params {
  transactional: string[],
  reward: string[],
}

export function allowedTokens({transactional, reward}: Params) {
  const mapper = (address: string, id: number) => ({address, id});
  const nonZeroAddress = ({address}: {address: string}) => address !== nativeZeroAddress;

  return {
    transactional: transactional.map(mapper).filter(nonZeroAddress),
    reward: reward.map(mapper).filter(nonZeroAddress),
  }
}