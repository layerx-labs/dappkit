export interface EIP4361Message {
  domain: string;
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