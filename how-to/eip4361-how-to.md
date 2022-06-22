### EIP4361 - Sign in with Ethereum
`@taikai/dappkit` provides an easy way of signing a session message conforming with both EIP712 and EIP4361 via the 
`eip461()` function provided by the `Web3Connection` class;

```typescript
import {Web3Connection, eip4361Params} from "@taikai/dappkit";
import ContractJson from 'path/to/contract/abi.json';

const connection = new Web3Connection({web3Host: "https://localhost:1337"});

await connection.start();
await connection.connect();

const session = eip4361Params(
  "https://domain.com",
  model.contractAddress,
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
 * Represents the hashed value of the session signed by the account
 */
const signature = await connection.eip4361(session);

// match that session hashed message matches with the connected account

const signer = connection.eth.accounts.recover(JSON.stringify(session), signature);
const signerIsConnectedAddress = signer === (await connection.getAddress());

```

###### reference

- [eip-4361](https://eips.ethereum.org/EIPS/eip-4361)
- [eip-712](https://eips.ethereum.org/EIPS/eip-712)