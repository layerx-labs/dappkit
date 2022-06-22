### EIP4361 - Sign in with Ethereum
dappkit provides a easy way of signing a session message conforming with both EIP712 and EIP4361 via the `eip461()` function provided by every extension of [`model.ts`](../src/base/model.ts):

```typescript
import {Model, eip4361Params} from "@taikai/dappkit";
import ContractJson from 'path/to/contract/abi.json';

const model = new Model({web3Host: "https://localhost:1337"}, ContractJson.abi, "0xContractAddress");

await model.start();
await model.connect();

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

const sig = await model.eip4361();

```

### Recovering

`eth-sig-util` and `ethereumjs-util` is still needed to be able to recover the signed data,
```shell
$ npm install --save eth-sig-util ethereumjs-util
```

```typescript
import {recoverTypedSignature_v4} from 'eth-sig-util';
import {toChecksumAddress} from 'ethereumjs-util';

const data = JSON.stringify(session);
const recovered = recoverTypedSignature_v4({data, sig});

// match that the signature was done by the connected user
const matches = toChecksumAddress(recovered) === toChecksumAddress(await model.getAddress())


```

###### reference

- [eip-4361](https://eips.ethereum.org/EIPS/eip-4361)
- [eip-712](https://eips.ethereum.org/EIPS/eip-712)