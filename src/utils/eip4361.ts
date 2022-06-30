import {EIP4361, EIP712Domain} from "@utils/constants";
import {EIP4361TypedData} from "@interfaces/eip4361";

export function eip4361Params(domain: string,
                              verifyingContract: string,
                              statement: string,
                              uri: string,
                              version: string,
                              chainId: number,
                              nonce: string,
                              issuedAt: string,
                              expirationTime: string,
                              notBefore: string,
                              requestId: string,
                              resources: string[],
                              contractName: string): EIP4361TypedData {

  return {
    domain: {chainId, name: contractName, verifyingContract, version},
    message: {
      domain,
      address: verifyingContract,
      statement,
      uri,
      version,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
      notBefore,
      requestId,
      resources,
      contractName
    },
    primaryType: "EIP4361",
    types: {EIP4361, EIP712Domain}
  }
}

export const nameType = (name: string, type: string) => ({name, type});