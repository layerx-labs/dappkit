interface Params {
  transactional: string[],
  reward: string[],
}

export function allowedTokens({transactional, reward}: Params) {
  return {transactional, reward,}
}