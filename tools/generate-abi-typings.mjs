import {lstatSync, readdirSync, readFileSync, writeFileSync} from "fs";
import {join, resolve} from "path";

const config = {
  /* import all json files on this directory */
  path: "build/contracts",

  /* output abis to this directory */
  destination: "src/interfaces/generated/abi",

  /* implicitly include files on config.path, if it has value it will filter files from config.path */
  include: [
    /NetworkV2/,
    /NetworkRegistry/,
    /BountyToken/,
    /^ERC1155Ownable/,
    /^ERC20(Ownable|Distribution|TokenLock)/,
    /^ERC4626/,
    /^ERC721Collectibles/,
    /StakingContract/,
    /Votable/,
    /^(Governed|Ownable|Pausable)\.json$/,
  ],

  /* file will be excluded if found on include and exclude */
  exclude: [
    /^[_I]/, /\.dbg\./i
  ],
}

const template = (content = "") =>
  `const artifact = ${content.trim()} as const;\nexport default artifact;`;

async function main() {
  console.log("Reading", resolve(config.path));

  const checkInclude = config.include.length > 0;
  const checkExclude = config.exclude.length > 0;

  const test = (key, file) => new RegExp(key).test(file);

  const findArtifacts = (path) => {
    const artifacts = [];

    readdirSync(path)
      .forEach(file => {
        const filePath = join(path, file);
        const stat= lstatSync(filePath);
        if (stat.isFile())
          artifacts.push(filePath);
        else findArtifacts(filePath);
      })

    return artifacts;
  }

  const files =
    findArtifacts(resolve(config.path))
      .filter(file =>
        (!checkExclude ? true : !config.exclude.some(key => test(key, file))) &&
        (!checkInclude ? true : config.include.some(key => test(key, file))));

  for (const [i, file] of Object.entries(files)) {
    const _filePath = resolve(config.path, file);
    const _exportFilePath = join(config.destination, file.replace(/\.json$/, ".ts"));
    console.log("Loading", +i+1, "of", files.length, _filePath);
    let content;
    try {
      content = JSON.stringify(await import(_filePath));
    } catch (e) {
      content = readFileSync(_filePath, 'utf-8');
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