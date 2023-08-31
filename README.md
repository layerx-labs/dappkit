# dappkit
A javascript SDK for web3 projects with curated community contracts to ease development and interactions with blockchain contracts. 

![Build Status](https://img.shields.io/github/actions/workflow/status/layerx-labs/dappkit/integration-tests.yml)
[![GitHub issues](https://img.shields.io/github/issues/layerx-labs/dappkit)](https://GitHub.com/taikai/dappkit/issues/)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ISC)


## Installation

```bash
$ npm install @taikai/dappkit
```

## Usage
`dappkit` offers tokens ([ERC20](https://sdk.dappkit.dev/classes/ERC20.html), [ERC721](https://sdk.dappkit.dev/classes/Erc721Standard.html), [ERC1155](https://sdk.dappkit.dev/classes/ERC1155Ownable.html) and [ERC4626](https://sdk.dappkit.dev/classes/ERC4626.html)) along with some other contracts, such as [Staking](https://sdk.dappkit.dev/classes/StakingContract.html) and [Voting](https://sdk.dappkit.dev/classes/Votable.html), for ease of use. you can check all the models over at the [SDK Documentation](https://sdk.dappkit.dev/).

### Simple browser connection
```ts
import {Web3Connection} from '@layerx-labs/dappkit';

const web3Connection = new Web3Connection({web3Host: 'https://rpc.tld'});
await web3Connection.connect();

console.log(`Address`, await web3Connection.getAddress());
```

It's possible to provide [more options](https://sdk.dappkit.dev/interfaces/Web3ConnectionOptions.html) (such as `privateKey`) to the `Web3Connection` class.
> Note: a Server side connection does not need to call `connect()` and should _when needed_ provide a `privateKey`

### Creating ERC20 tokens

```ts
import {ERC20} from '@layerx-labs/dappkit';

const erc20 = new ERC20({ web3Host: process.env.WEB3_HOST_PROVIDER });

await erc20.deployJsonAbi(
  'Token Name', // the name of the token
  '$tokenSymbol', // the symbol of the token
  "1000000000000000000000000", // the total amount of the token (with 18 decimals; 1M = 1000000000000000000000000)
  "0xOwnerOfErc20Address" // the owner of the total amount of the tokens (your address)
);

console.log(`ERC20 address`, erc20.contractAddress);
```
> Note: Full model documentation [on the sdk](https://sdk.dappkit.dev/classes/ERC20.html)

### Creating ERC721 NFTs

```ts
import {ERC721Collectibles} from '@layerx-labs/dappkit'

const erc721 = new ERC721Collectibles({web3Host: 'http://rpc.tld'});

await erc721.deployJsonAbi(
  `Token Name`, 
  `$token_symbol`, 
  1, // how many packs can be open of this collectible (0 = infinite)
  `0xAddressOfPurchasingAddress`, // address of the erc20 used to open packs
  `0xBaseFeeAddress`, // address for where the main fee goes
  `0xFeeAddress`, // address for where fee from purchases and pack shares
  `0xAnotherAddress`); // adress for pack shares fee

console.log(`ERC721 address`, erc721.contractAddress)
```
> Note: Full model documentation [on the sdk](https://sdk.dappkit.dev/classes/ERC721Collectibles.html)

### Creating ERC1155

```ts
import {ERC1155Ownable} from "@layerx-labs/dappkit";

const erc1155 = new ERC1155Ownable({web3Host: 'http://rpc.tld'});

await erc1155.deployJsonAbi('http://my.token-uri.tld/');

console.log(`ERC1155 address`, erc1155.contractAddress);
```
> Note: Full model documentation [on the sdk](https://sdk.dappkit.dev/classes/ERC1155Ownable.html)

### Creating ERC4626
```ts
import {ERC4626} from "@layerx-labs/dappkit";

const erc4626 = new ERC4626({web3Host: 'http://rpc.tld'})

await erc4626.deployJsonAbi(`0xUnderlyingERC20Address`, `Vault Name`, `$vault_symbol`);

console.log(`ERC4626 address  `, erc4626.contractAddress);
```
> Note: Full model documentation [on the sdk](https://sdk.dappkit.dev/classes/ERC4626.html)

## Documentation 

* [Guides](https://docs.dappkit.dev/sdk-documentation/start-building/how-to-guides)
* [Advanced](./how-to/readme.md)
* [SDK Documentation](https://sdk.dappkit.dev/)
* [Use Cases](https://docs.dappkit.dev/sdk-documentation/use-cases)

Please refer to the [`test/`](./test/models) folder to read further usage examples of the various contracts available.

## Quick start
- [Node JS](https://stackblitz.com/edit/node-b3cgaa?file=index.js)
- [NextJs](https://stackblitz.com/edit/nextjs-nzulwe?file=pages/index.js)
- [Angular](https://github.com/taikai/dappkit-testflight)

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