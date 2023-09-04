import {readFileSync, existsSync} from "fs";
import {resolve} from "path";
import {config} from "hardhat";
import {deriveKeyFromMnemonicAndPath} from "hardhat/internal/util/keys-derivation";
import {type HardhatNetworkHDAccountsConfig} from "hardhat/src/types/config";

/**
 * Returns the private key from the output provided by ganache
 * @param index
 */
export function getPrivateKeyFromFile(index = 0) {
  if (existsSync(resolve('./keys.json')))
    return Object.values(JSON.parse(readFileSync(resolve('./keys.json'), 'utf-8')).private_keys)[index] as string;
  const accounts = config.networks.hardhat.accounts as HardhatNetworkHDAccountsConfig;
  return deriveKeyFromMnemonicAndPath(process.env.CI_MNEMONIC!, accounts.path + `/${index}`, accounts.passphrase)!;
}