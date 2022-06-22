import {EIP4361Message} from "@interfaces/eip4361-message";

export function eip4361Params(domain: string,
                              address: string,
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
                              contractName: string): EIP4361Message {
  return {
    domain,
    address,
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
  }
}

export const nameType = (name: string, type: string) => ({name, type});