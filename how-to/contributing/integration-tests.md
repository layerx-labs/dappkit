# Testing your new contract / js proxy
Adding a new test to the integration solution is needed for new implementations to be accepted.
This can be done by introducing a file under the correct pathing on `test` folder, essentially following the same path
that the file has on its `src` counterpart.


## Available utilities

| file         | description                       |
|--------------|-----------------------------------|
| constants.ts | holds constants used on the tests |
| index.ts     | holds functions used on the tests |

|fn|description| example                                                         |
|---|---|-----------------------------------------------------------------|
|defaultWeb3Connection|A helper function to start a web3connection from process.env files| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L22)  |
|modelExtensionDeployer|Agnostic model deployer to help out in the deployment of initial contracts| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L34)  |
|erc20Deployer|Helper to deploy ERC20 tokens| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L41)  |
|getChainDate|Return chain date||
|hasTxBlockNumber|Assert that the promise returns a block number||
|revertChain|Revert the chain to its default state||
|increaseTime|Advance in time by mining a block on the chain||
|shouldBeRejected|Helper to assert that the promise needs to be rejected| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L322) |
|newWeb3Account|Create a new account and return it| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L137) |
|getPrivateKeyFromFile|Returns the private key from the output provided by ganache| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L34)  |