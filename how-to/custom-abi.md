# Using @taikai/dappkit with a custom contract
@taikai/dappkit exports [`Model`](https://sdk.dappkit.dev/classes/Model.html) class that needs an ABI structure as its constructor argument; It can be used to either extend and create a custom proxy by having transpiled the json or simply import the `Model` class and start using your compiled contract.

---

1. [Deploy custom contract](#deploying-the-custom-contract)
2. [Using a custom contract](#using-a-custom-contract)
3. [Deploy transpiled custom contract](#transpiled-deploy)
4. [Use the transpiled custom contract](#transpiled-use)

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

## With transpiling
Install [`@taikai/dappkit-launchpad`](https://github.com/taikai/dappkit-launchpad) globally
```bash
$ npm i -g @taikai/dappkit-launchpad
```

### Transpiling the contract 
```bash
$ dk-transpile -f "path/to/CustomContract.json" -j config.json
```

Depending on your configuration (and contract) this will output a extension of the [`Model`](https://sdk.dappkit.dev/classes/Model.html) class, with the methods loaded in, and with the name of the file matching the name of the contract.

### Deploying the custom contract <a name="transpiled-deploy"></a>

```typescript
import {CustomContract} from './path/to/CustomContract';
const customContract = new CustomContract({web3Host: 'http://localhost:1337', privateKey: '0xPrivateKey'});

customContract.web3Connection.start();
customContract.loadAbi();

const tx = await customContract.deployJsonAbi('arg1', 'arg2'/*, arg3, arg4, ...etc*/);
console.log('Deployed contract; Address: ', tx.contractAddress);
```

### Using the custom contract <a name="transpiled-use"></a>
```typescript
const customContract = new CustomContract({web3Host: 'http://localhost:1337', privateKey: '0xPrivateKey'});

customContract.start();

// Get a value on the contract
const receipt = await customContract.CustomMethod('arg1'/*, 'otherArgument', ...etc */);

// Change a value on the contract
const receipt2 = await customContract.OtherCustomMethod('newValue'/*, 'otherArgument', ...etc */)
```