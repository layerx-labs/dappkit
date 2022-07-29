# Testing your new contract / js proxy
Adding a new test to the integration solution is needed for new implementations to be accepted.
This can be done by introducing a file under the correct pathing on `test` folder, essentially following the same path
that the file has on its `src` counterpart.


### Available utilities

|fn|description| example                                                         |
|---|---|-----------------------------------------------------------------|
|defaultWeb3Connection|A helper function to start a web3connection from process.env files| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L22)  |
|modelExtensionDeployer|Agnostic model deployer to help out in the deployment of initial contracts| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L34)  |
|erc20Deployer|Helper to deploy ERC20 tokens| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L41)  |
|getChainDate|Return chain date| [sablier.spec.ts](../../test/models/sablier.spec.ts#L77)        |
|hasTxBlockNumber|Assert that the promise returns a block number| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L71)  |
|revertChain|Revert the chain to its default state| [network-v2.spec.ts](../../test/utils/index.ts#L114)            |
|increaseTime|Advance in time by mining a block on the chain| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L199) |
|shouldBeRejected|Helper to assert that the promise needs to be rejected| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L322) |
|newWeb3Account|Create a new account and return it| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L137) |
|getPrivateKeyFromFile|Returns the private key from the output provided by ganache| [network-v2.spec.ts](../../test/models/network-v2.spec.ts#L34)  |

## Writing tests
Written tests should follow this logic:
```ts
describe(`Your contract name`, () => {
  before(() => {
    /**
     * use before hook to rever the chain
     * as well as creating any accounts needed for this integration test
     * `defaultWeb3Connection()` can (and should) be used here
     */
  });
  
  it(`Deploys dependencies of contract`, () => {
    /**
     * The first `it` should always deploy the needed contracts
     * in order for this test to function properly.
     * Since we aren't testing _the dependencies_ we can batch
     * all the contracts needed in one it
     * `modelExtensionDeployer()` can (and should) be used here
     */
  });
  
  it(`Deploys the integration contract`, () => {
    /**
     * Use this block to deploy the contract that will be tested
     * don't forget to assign its contractAddress to a variable
     */
  })
  
  describe(`Governed`, () => {
    /**
     * Test functions that can only be accessed by Governors
     */
  });
  
  describe(`Public`, () => {
    /**
     * Test functions that can be accessed by anyone else
     * more describes can be used to encapsulate flows
     */
  });
})
```