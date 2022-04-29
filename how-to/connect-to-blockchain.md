# Connecting to a EVM RPC
@taikai/dappkit exports [Web3Connection](https://sdk.dappkit.dev/classes/Web3Connection.html) class that controls the connection to the provided Web3 Host RPC.

An instance of this class can be shared amongst all the `Model` implementations.

## With a private key

```typescript
import {Web3Connection, Web3ConnectionOptions} from '@taikai/dappkit';

const options: Web3ConnectionOptions = {
    web3Host: 'http://localhost:1337',
    privateKey: 'ub3rk3y'
}

const web3Connection = new Web3Connection(options);

web3Connection.start();
```

## Without a private key (metamask)
Connecting without a private key will require the user to have a wallet plugin. Currently, only metamask is supported.

```typescript
import {Web3Connection} from '@taikai/dappkit';

const web3Connection = new Web3Connection({web3Host: 'http://localhost:1337'});

web3Connection.start();
await web3Connection.connect();
```