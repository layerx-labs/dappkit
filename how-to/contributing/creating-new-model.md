# Creating a new Model

After having created the new contract under `contracts` folder and called `npm run compile` create a base proxy of a contract by issuing
```bash
$ npm run dk-transpile -- -f "path/to/ContractName.json"
```

This will output the files according to [`dk-config.json`](../../dk-config.json)

```json5
{
  // ...
  "output": {
    "interfaceDir": "./src/interfaces/methods/",
    "classDir": "./src/models/",
    "eventsDir": "./src/interfaces/events/"
  },
}
```

The file that really is of interest will be outputted to `classDir`, this is the file that can be edited to ease the 
bridge between javascript and solidity, such as converting numbers or making sure arguments are what we are expecting
before sending the payload through the chain.

If your any of the contract functions return an object, you should create a new util under `src/utils` that will receive
the parameters and output parsed object. An example of this can be seen at [`network-v2.ts:getOraclesResume()`](../../src/models/network-v2.ts)
where `oraclesResume` is used to parse the entry arguments into readable javascript values and respect the return type
provided by launchpad when we transpiled the contract.

## Number utilities
We provide some number utilities to try and standardize the way we handle numbers (and dates) from, and to, the smart 
contract and these can be imported from `@utils/numbers.ts`

| fn                          | description                                                                                                     | example                                                                 |
|:----------------------------|:----------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------|
| `toSmartContractDecimals(value: string&#124;number, decimals = 18)`   | convert a simple number into a big number representation, usually used to convert to ERC20 token correct number | [getTokenAmount()](../../src/models/erc20.ts#L42)                       |
| `fromSmartContractDecimals(value: string&#124;number&#124;BigNumber, decimals = 18)` | convert a ERC20 token value into javascript number                                                              | [transferTokenAmount()](../../src/models/erc20.ts#L47)                  |
| `toSmartContractDate(date: number&#124;Date)`       | converts a javascript date (ms) to a smart contract date (s)                                                    | [setInitialDistribution()](../../src/models/erc20-distribution.ts#L109) |
| `fromSmartContractDate(date: number)`     | converts from a smart contract date (s) to javascript date (ms)                                                 | [stakingProduct()](../../src/utils/staking-product.ts#L25)              |

For constant values, there is the `@utils/constants.ts` file that's self-explanatory.