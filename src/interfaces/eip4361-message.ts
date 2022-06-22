export interface EIP4361Message {
  domain: string;
  /**
   * Model will use its own contract address if it has one, overwriting the provided value
   */
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  notBefore: string;
  requestId: string;
  resources: string[];
  contractName: string;
}