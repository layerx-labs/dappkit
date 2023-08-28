import {lstatSync, readFileSync} from "fs";
import {getFilesOnDir} from "./get-files-on-dir.mjs";

let limit = process.argv[3] || 24576;

const getContractSize = (json) => {
  const {contractName, bytecode} = JSON.parse(json);
  const size = (bytecode.length / 2) - 1;
  return {
    contractName,
    size: `${size/1000} kb`,
    overflow: size > limit ? true : '',
  }
}

const jsonOrPath = process.argv[2];

if (lstatSync(jsonOrPath).isFile())
  console.table([getContractSize(readFileSync(jsonOrPath))])
else
  console.table(getFilesOnDir(jsonOrPath)
    .filter(f => f.endsWith(`.json`) && !f.endsWith('.dbg.json'))
    .map(f => getContractSize(readFileSync(f))))