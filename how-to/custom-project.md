### Custom Project
A custom project is a project wich only depends on dappkit (and dappkit-launcher) to complement its own Solidity contracts.

#### Dependencies
```shell
$ npm i -s @taikai/dappkit
$ npm i -g @taikai/dappkit-launchpad
```

@taikai/dappkit will be used to provide the user with proxies for common contracts, along with a Web3Connection, and @taikai/dappkit-launchpad will be responsible for transpiling your custom contract into something understandable by @taikai/dappkit.

#### Compiling your contracts
Both truffle and hardhat will provide a `ContractName.json` file wich holds the ABI and bytecode for the contract

##### Truffle
```shell
$ npm i -g truffle
$ truffle compile
```

##### Hardhat
```shell
$ npx install --save-dev hardhat
$ npx hardhat compile
```

## Transpiling and using your custom contract <a name="transpile"></a>
```bash
$ dk-transpile -f "path/to/ContractName.json"
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