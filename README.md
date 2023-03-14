# dappkit
A javascript SDK for web3 projects with curated community contracts to ease development and interactions with blockchain contracts. 

![Build Status](https://img.shields.io/github/actions/workflow/status/taikai/dappkit/integration-tests.yml)
[![GitHub issues](https://img.shields.io/github/issues/taikai/dappkit)](https://GitHub.com/taikai/dappkit/issues/)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ISC)


## Installation

```bash
$ npm install @taikai/dappkit
```

## Usage

```ts
import {ERC20} from '@taikai/dappkit';

const erc20 = new ERC20({ web3Host: process.env.WEB3_HOST_PROVIDER });

await erc20.connect(); // connect web3 by asking the user to allow the connection and interact with the chain

const tx =
  await erc20Deployer.deployJsonAbi(
    'Token Name', // the name of the token
    '$tokenSymbol', // the symbol of the token
    "1000000000000000000000000", // the total amount of the token (with 18 decimals; 1M = 1000000000000000000000000)
    "0xOwnerOfErc20Address" // the owner of the total amount of the tokens (your address)
  );

await erc20.transferTokenAmount('0xYourOtherAddress', 1); // transfer 1 token from your address to other address
```

### Just want to start a connection?

```ts
import {Web3Connection} from '@taikai/dappkit';

const web3Connection = new Web3Connection({web3Host: 'https://rpc.tld'});

await web3Connection.connect();

console.log(`Address`, await web3Connection.getAddress());
```

### Server side?

```ts
import {Web3Connection, Web3ConnectionOptions} from '@taikai/dappkit';

const web3ConnecitonOptions: Web3ConnectionOptions = {
  web3Host: 'https://rpc.tld',
  privateKey: 'your-private-key', // never share your private key
}

const web3Connection = new Web3Connection(web3ConnecitonOptions);

console.log(`Address`, await web3Connection.getAddress());
```

## Documentation 

* [Guides](https://docs.dappkit.dev/sdk-documentation/start-building/how-to-guides)
* [Advanced](./how-to/readme.md)
* [SDK Documentation](https://sdk.dappkit.dev/)
* [Use Cases](https://docs.dappkit.dev/sdk-documentation/use-cases)

Please refer to the [`test/`](./test/models) folder to read further usage examples of the various contracts available.

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