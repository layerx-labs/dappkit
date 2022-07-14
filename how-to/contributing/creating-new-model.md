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

If your contract returns an object, you should create a new util under `src/utils` that will receive the parameters and 
output parsed object. An example of this can be seen at [`network-v2.ts:getOraclesResume()`](../../src/models/network-v2.ts)
where `oraclesResume` is used to parse the entry arguments into readable javascript values and respect the return type
provided by launchpad when we transpiled the contract.