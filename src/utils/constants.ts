import {nameType} from "@utils/eip4361";

export const nativeZeroAddress = '0x0000000000000000000000000000000000000000';
export const Thousand = 1000;

export const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

export const EIP4361 = [
  nameType("domain", "string"),
  nameType("address", "string"),
  nameType("statement", "string"),
  nameType("uri", "string"),
  nameType("version", "string"),
  nameType("chainId", "uint256"),
  nameType("nonce", "string"),
  nameType("issuedAt", "string"),
  nameType("expirationTime", "string"),
  nameType("notBefore", "string"),
  nameType("requestId", "string"),
  nameType("contractName", "string"),
  nameType("resources", "string[]"),
];