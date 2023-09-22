import {lstatSync, readFileSync, writeFileSync} from "fs";
import {getFilesOnDir} from "./get-files-on-dir.mjs";

const KEEP_ROOT_KEYS = ['abi', 'bytecode', 'contractName'];

function cleanFile(file = "") {
  const origin = JSON.parse(readFileSync(file, {encoding: "utf-8"}));
  return JSON.stringify(KEEP_ROOT_KEYS.reduce((prev, curr) => ({...prev, [curr]: origin[curr]}), {}));
}

try {
  const jsonOrPath = process.argv[2];
  const stat = lstatSync(jsonOrPath);

  if (stat.isFile())
    writeFileSync(jsonOrPath, cleanFile(jsonOrPath), "utf-8");
  else
    getFilesOnDir(jsonOrPath)
      .filter(file => file.endsWith(".json") && !file.endsWith(".dbg.json"))
      .forEach(pathToFile => writeFileSync(pathToFile, cleanFile(pathToFile), "utf-8"));

} catch (e) {
  console.error('Error', e);
  process.exit(1);
}