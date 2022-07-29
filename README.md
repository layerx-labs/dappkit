# dappkit
A javascript SDK for web3 projects with curated community contracts to ease development and interactions with blockchain contracts. 

![Build Status](https://img.shields.io/github/workflow/status/taikai/dappkit/integration-tests)
[![GitHub issues](https://img.shields.io/github/issues/taikai/dappkit)](https://GitHub.com/taikai/dappkit/issues/)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ISC)


## Installation

```bash
$ npm install @taikai/dappkit
```

## Usage

```ts
import {Web3Connection, ERC20} from '@taikai/dappkit';

const connection = new Web3Connection({ web3Host: process.env.WEB3_HOST_PROVIDER });

await connection.start(); // start web3 connection so assignments are made
await connection.connect(); // connect web3 by asking the user to allow the connection (this is needed for the user to _interact_ with the chain)

const erc20Deployer = new ERC20(connection);
await erc20Deployer.loadAbi(); // load abi contract is only needed for deploy actions

const tx =
  await erc20Deployer.deployJsonAbi(
    'Token Name', // the name of the token
    '$tokenSymbol', // the symbol of the token
    "1000000000000000000000000", // the total amount of the token (with 18 decimals; 1M = 1000000000000000000000000)
    await erc20Deployer.connection.getAddress() // the owner of the total amount of the tokens (your address)
  );

console.log(tx); // { ... , contractAddress: string} 

const myToken = new ERC20(connection, tx.contractAddress);

await myToken.start() // load contract and connection into the class representing your token
await myToken.transferTokenAmount('0xYourOtherAddress', 1); // transfer 1 token from your address to other address

```
Please refer to the [`test/`](./test/models) folder to read further usage examples of the various contracts available.

## Documentation 

* [Guides](https://docs.dappkit.dev/sdk-documentation/start-building/how-to-guides)
* [Advanced](./how-to/readme.md)
* [SDK Documentation](https://sdk.dappkit.dev/)
* [Use Cases](https://docs.dappkit.dev/sdk-documentation/use-cases)

### How to Generate Documentation 

You can generate the documentation locally by issuing 
```
$ npm run docs
```
and then serving the `docs/` folder as a root http-server.

## Contribution

Contributions are welcomed, but we ask that you read existing code guidelines, specially the code format. 
Please review [Contributor guidelines](https://github.com/taikai/dappkit/blob/master/CONTRIBUTING.md)

## License

[ISC](./LICENSE.txt)

### Notes
- [Docker support](./docker-readme.md)
- [CoC](./CODE_OF_CONDUCT.md)
- [Dependencies](./DEPENDENCIES.md)