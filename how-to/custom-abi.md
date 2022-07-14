# Using @taikai/dappkit with a custom contract
@taikai/dappkit exports [`Model`](https://sdk.dappkit.dev/classes/Model.html) class that needs an ABI structure as its constructor argument; It can be used to either extend and create a custom proxy by having transpiled the json or simply import the `Model` class and start using your compiled contract.

This can also be achieved by transpiling the custom contract and importing the newely created file, after optionally customizing the outputted code.

---

1. [Deploy custom contract](#deploying-the-custom-contract)
2. [Using a custom contract](#using-a-custom-contract)
3. [Deploy transpiled custom contract](./custom-project.md/#transpiled-deploy)
4. [Use the transpiled custom contract](./custom-project.md/#transpiled-use)

---
## Without transpiling

### Deploying the custom contract
```typescript
import {Model} from '@taikai/dappkit';

const AlicePrivateKey = "aliceprivatekey";
const AliceCustomContract = "./AliceCustomContract.json";

const AliceCustomModel = new Model({web3Host: 'https://localhost:1337', privateKey: AlicePrivateKey}, AliceCustomContract.abi);

AliceCustomModel.web3Connection.start();
AliceCustomModel.loadAbi();

const tx = await AliceCustomModel.deploy({data: AliceCustomContract.bytecode, arguments: []}, AliceCustomModel.web3Connection.Account);

console.log('Contract deployed; Address: ', tx.contractAddress);
```

### Using a custom contract
```typescript
import {Model} from '@taikai/dappkit';

const AliceCustomModel = new Model({web3Host: 'https://localhost:1337', privateKey: AlicePrivateKey}, AliceCustomContract.abi, '0xCustomContractAddress');

AliceCustomModel.start();

// Get a value from the contract
const receipt = await AliceCustomModel.callTx(AliceCustomModel.contract.methods.CustomMethod('arg1'/*, 'otherArgument', ...etc */));
console.log(receipt);

// Change a value on the contract
const receipt2 = await AliceCustomModel.sendTx(AliceCustomModel.contract.methods.OtherCustomMethod('newValue'/*, 'otherArgument', ...etc */));
console.log(receipt2);
```