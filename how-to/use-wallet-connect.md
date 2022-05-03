# Wallet connect
@taikai/dappkit supports Wallet Connect (and any other web3 provider) via the `Web3ConnectionOptions.web3CustomProvider`.

## Dependencies
```shell
$ npm install --save web3 @walletconnect/web3-provider
```

## Usage
```typescript
import WalletConnectProvider from "@walletconnect/web3-provider";
import {Web3Connection} from "@taikai/dappkit";

// Create WalletConnect Provider
const provider = new WalletConnectProvider({ /* WalletConnect provider options go here */ });

// Enable session (triggers QR Code modal)
await provider.enable();

// Provide the custom provider to Web3Connection
const web3Connection = new Web3Connection({web3CustomProvider: provider});

// If `provider` was already connected when provided, then Web3Connection started itself and requested the accounts;
// Otherwise you'll need to do that by hand,

await provider.enable(); // you only need to enable if you didn't enable before;

web3Connection.start();
await web3Connection.connect();

console.log('Connected address', await web3Connection.getAddress()) // Connected address: 0x1234...

```