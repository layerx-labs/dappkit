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

The file that really is of interest will be outputted to `classDir` option on the configuration, its name will match 
the contract name with kebab-case (`contract-name.ts`), this is the file that can be edited to ease the  bridge between 
javascript and solidity, such as converting numbers or making sure arguments are what we are expecting before sending 
the payload through the chain.

If any of the contract functions return an object, you should create a new util under `src/utils` that will receive
the parameters and output parsed object; An example of this can be seen at [`network-v2.ts:getOraclesResume()`](../../src/models/network-v2.ts)
where `oraclesResume` is used to parse the entry arguments into readable javascript values and respect the return type
provided by launchpad when we transpiled the contract.

### Number utilities
We provide some number utilities to try and standardize the way we handle numbers (and dates) from, and to, the smart 
contract and these can be imported from `@utils/numbers.ts`

| fn                          | description                                                   | example                                                              |
|:----------------------------|:--------------------------------------------------------------|:---------------------------------------------------------------------|
| toSmartContractDecimals   | convert a simple number into a (text) big number representation | [erc20.ts](../../src/models/erc20.ts#L42)                            |
| fromSmartContractDecimals | convert a ERC20 token value into javascript number              | [erc20.ts](../../src/models/erc20.ts#L47)                            |
| toSmartContractDate       | converts a javascript date (ms) to a smart contract date (s)    | [erc20-distribution.ts](../../src/models/erc20-distribution.ts#L109) |
| fromSmartContractDate     | converts from a smart contract date (s) to javascript date (ms) | [staking-product.ts](../../src/utils/staking-product.ts#L25)         |


For constant values, there is the `@utils/constants.ts` file that's self-explanatory.

## Exporting the new model and its utilities
Hop on to `src/index.ts` and find the relevant section of imports and add a line with your export, remember to organize
the exports _alphabetically_ (you can do this easily by sorting _your local files_ alphabetically as well and just
mirror the folder structure).

Don't forget to export your interfaces as well as your utilities and class model.