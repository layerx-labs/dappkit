import {lstatSync, readdirSync, readFileSync, writeFileSync} from "fs";
import {basename, join, resolve} from "path";
import {getFilesOnDir} from "./get-files-on-dir.mjs";

const config = {
  /* import all json files on this directory */
  path: "artifacts/contracts",

  /* output abis to this directory */
  destination: "src/interfaces/generated/abi",

  /* implicitly include files on config.path, if it has value it will filter files from config.path */
  include: [
    /Network(Registry|V2)?/,
    /BountyToken/,
    /^ERC1155Ownable/,
    /^ERC20(Ownable|Distribution|TokenLock)/,
    /Token\.json$/,
    /^ERC4626/,
    /^ERC721(Collectibles|Standard)/,
    /StakingContract/,
    /Votable/,
    /^(Governed|Ownable|Pausable)\.json$/,
  ],

  /* file to be excluded */
  exclude: [
    /^[_I]/,
    /\.dbg\.json$/i
  ],
}

const template = (content = "") =>
  `const artifact = ${content.trim()} as const;\nexport default artifact;`;

async function main() {
  console.log("Reading", resolve(config.path));

  const checkInclude = config.include.length > 0;
  const checkExclude = config.exclude.length > 0;

  const test = (key, file) => new RegExp(key).test(file);

  const files =
    getFilesOnDir(resolve(config.path))
      .filter(file =>
        (!checkExclude ? true : !config.exclude.some(key => test(key, basename(file)))) &&
        (!checkInclude ? true : config.include.some(key => test(key, basename(file)))));

  for (const [i, _filePath] of Object.entries(files)) {
    const _exportFilePath = join(config.destination, basename(_filePath.replace(/\.json$/, ".ts")));
    console.log("Loading", +i+1, "of", files.length, _filePath);
    let content;
    try {
      content = JSON.stringify(await import(_filePath));
    } catch (e) {
      content = JSON.stringify(JSON.parse(readFileSync(_filePath, {encoding: "utf-8"})));
    }

    try {
      writeFileSync(_exportFilePath, template(content));
    } catch (e) {
      console.log("Error writing file", _exportFilePath, e);

      // eslint-disable-next-line no-undef
      process.exit(1);
    }
  }

  console.log("Wrote to", resolve(config.destination));
}



main()
  .finally(() => {
    console.log("ended");
  });