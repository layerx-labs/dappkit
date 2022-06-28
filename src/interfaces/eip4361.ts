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

export interface EIP4361TypedData {
  domain: { chainId: number; name: string; version: string; verifyingContract: string };
  primaryType: "EIP4361";
  message: EIP4361Message;
  types: { EIP4361: { name: string; type: string }[]; EIP712Domain: { name: string; type: string }[] };
}