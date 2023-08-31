import {readFileSync} from "fs";
import {resolve} from "path";

/**
 * Returns the private key from the output provided by ganache
 * @param index
 */
export function getPrivateKeyFromFile(index = 0) {
  return Object.values(JSON.parse(readFileSync(resolve('./keys.json'), 'utf-8')).private_keys)[index] as string;
}