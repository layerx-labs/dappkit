/** @type import('hardhat/config').HardhatUserConfig */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {readFileSync, existsSync} = require("fs");

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const {DEV_PRIVATE_KEY} = process.env;

const account = (privateKey, balance = "10000000000000000000000") =>
  ({privateKey, balance})

const accounts = [];
let moreNetworks = {};

if (DEV_PRIVATE_KEY)
  accounts.push(account(DEV_PRIVATE_KEY));

if (existsSync('./keys.json'))
  accounts
    .push(...Object.values(JSON.parse(readFileSync('./keys.json', {encoding: 'utf-8'}))?.private_keys)
      .map(pvtKey => account(pvtKey)))

if (existsSync('./networks.json'))
  moreNetworks = JSON.parse(readFileSync('./.networks.json', {encoding: "utf-8"}));


module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      accounts,
    },
    ... moreNetworks,
  }
};
