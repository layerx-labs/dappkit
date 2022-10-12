import Contracts from '@truffle/workflow-compile';
const {default: {compileAndSave}} = Contracts; // truffle being truffle

const config = {
  contracts_directory: "./contracts/",
  contracts_build_directory: "./build/contracts/",
  compilers: {
    solc: {
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}

compileAndSave(config)
  .catch(e => {
    console.error(`Error`, e);
    process.exit(1)
  });