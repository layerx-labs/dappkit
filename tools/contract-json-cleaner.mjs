import {lstatSync, readFileSync, writeFileSync, readdirSync} from "fs";
import {resolve} from "path";

const KEEP_ROOT_KEYS = ['abi', 'bytecode'];

function cleanFile(file = "") {
  const origin = JSON.parse(readFileSync(file, "utf-8"));
  return JSON.stringify(KEEP_ROOT_KEYS.reduce((prev, curr) => ({...prev, [curr]: origin[curr]}), {}));
}

try {
  const jsonOrPath = process.argv[2];
  const stat = lstatSync(jsonOrPath);

  if (stat.isFile())
    writeFileSync(jsonOrPath, cleanFile(jsonOrPath), "utf-8");
  else
    readdirSync(jsonOrPath)
      .filter(file => file.endsWith(".json"))
      .forEach(file => {
        const pathToFile = resolve(jsonOrPath, file);
        writeFileSync(pathToFile, cleanFile(pathToFile), "utf-8")
      });
} catch (e) {
  console.error('Error', e);
  process.exit(1);
}