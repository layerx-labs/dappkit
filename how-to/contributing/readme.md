# Contributing

Read our [CoC](../../CODE_OF_CONDUCT.md) and our [Contributing Guide](../../CONTRIBUTING.md)

# Setting up the environment

After having checked out the main branch and followed the contributing guide, you can issue `npm install` under your cloned dappkit directory.

## Compile contracts
```bash
$ npm run compile-contracts
```

## Build typescript solution
```bash
$ npm run compile-ts
```

## Setting up e2e
1. copy `.env.dist` to `.env` file
2. fill in the values

```bash
$ npm run test-ci
```

---

### You can now:
- [Create new Models](./creating-new-model.md)
- [Create integration tests](./integration-tests.md)