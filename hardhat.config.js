/** @type import('hardhat/config').HardhatUserConfig */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const {CI_MNEMONIC} = process.env;
const ACCOUNT_BALANCE = "10000000000000000000000";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 1000
      },
      accounts: {
        mnemonic: CI_MNEMONIC, accountsBalance: ACCOUNT_BALANCE, count: 10
      }
    },
  }
};
