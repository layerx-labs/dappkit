### EIP4361 - Sign in with Ethereum
`@taikai/dappkit` provides an easy way of conforming with EIP4361 and EIP712 to help users signing in with Ethereum, it 
does this by providing the utility function `eip4361Params()`. `eth-sig-util` will still be needed if you're signing from
a node-process or trying to recover the signer address.

```shell
$ npm i -s eth-sig-util
```

```typescript
import {Web3Connection, eip4361Params, jsonRpcParams, TypedDataV4} from "@taikai/dappkit";

// only needed for recover and/or signing with private key
import {recoverTypedSignature_v4, signTypedData_v4} from 'eth-sig-util'; 

const connection = new Web3Connection({web3Host: "https://localhost:1337"});

await connection.start();
await connection.connect();

const typedSessionDetails = eip4361Params(
  "https://domain.com",
  "0xContractAddress",
  "Message statement",
  "uri",
  "1.0",
  "x-nonce",
  new Date().toISOString(),
  new Date(+new Date() + 3600 * 60).toISOString(),
  new Date(+new Date() + 60 * 60).toISOString(),
  "x-request-id",
  ["path/to/exemple-resource.pdf"],
  "Contract Name"
)

/**
 * Send typed data to the current RPC provider
 */
async function sendTypedData(message: TypedDataV4, from: string) {
  return new Promise((resolve, reject) => {
    const callback = (error: Error|null, value: any|null) => error ? reject(error) : resolve(value?.result);
    
    try {
      (connection.Web3.currentProvider as (HttpProvider|WebsocketProvider))
        .send(jsonRpcParams(`eth_signTypedData_v4`, [from, JSON.stringify(message)]), callback);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Represents the hashed value of the session signed by the account, using metamask
 */
const signature = await sendTypedData(typedSessionDetails);

/**
 * Represents the hashed value of the session signed by the account, using private key
 */
const privateKeyedSignature = await signTypedData_v4("0xPr1v473K", {data: typedSessionDetails});

// match that session hashed message matches with the connected account

const signer = recoverTypedSignature_v4({data: typedSessionDetails, sig: signature});
const signerIsConnectedAddress = signer === (await connection.getAddress());
```

###### reference

- [eip-4361](https://eips.ethereum.org/EIPS/eip-4361)
- [eip-712](https://eips.ethereum.org/EIPS/eip-712)
- [metamask](https://docs.metamask.io/guide/signing-data.html#sign-typed-data-v4)