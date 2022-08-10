import {lstatSync, readFileSync, readdirSync} from "fs";
import {resolve} from "path";

let limit = process.argv[3] || 24576;

const outputSize = (json) => {
  const {contractName, bytecode} = JSON.parse(json);
  const size = (bytecode.length / 2) - 1;
  console.log(size/1000, `kb`, `\t`, contractName, `\t\t`, size > limit ? `Overflow` : ``);
}

const jsonOrPath = process.argv[2];
const stat = lstatSync(jsonOrPath);

if (stat.isFile())
  outputSize(readFileSync(jsonOrPath))
else
  readdirSync(jsonOrPath)
    .filter(f => f.endsWith(`.json`))
    .forEach(f => outputSize(readFileSync(resolve(jsonOrPath, f))))