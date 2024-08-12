export default {
  /* import all json files on this directory */
  path: "artifacts/contracts",

  /* output abis to this directory */
  destination: "src/interfaces/generated/abi",

  /* implicitly include files on config.path, if it has value it will filter files from config.path */
  include: [
    /Network(Registry|V2)?/,
    /BountyToken/,
    /^ERC1155Ownable/,
    /^ERC20(Ownable|Distribution|TokenLock|Capped)/,
    /^ERC4626/,
    /^ERC721(Collectibles|Standard)/,
    /StakingContract/,
    /Votable/,
    /^(Governed|Ownable|Pausable)\.json$/,
  ],

  /* file to be excluded */
  exclude: [
    /^[_I]/, // eagerly ignore _?Interfaces
    /\.dbg\.json$/i // and ignore the dbg file created by hardhat
  ],
}