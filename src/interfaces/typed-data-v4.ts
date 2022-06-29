export interface typedData { name: string; type: string }

export interface TypesForTypedData {
  [k: string]: (typedData[] | typedData);
  EIP712Domain: typedData[]
}

export interface TypedDataV4 {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
    [key: string]: string|number;
  },
  primaryType: string;
  message: Record<string, string>;
  types: TypesForTypedData;
}