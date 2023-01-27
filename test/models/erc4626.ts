import {describe} from "mocha";
import {defaultWeb3Connection, erc20Deployer, hasTxBlockNumber, increaseTime, modelExtensionDeployer} from "../utils";
import {ERC20, toSmartContractDecimals, Web3Connection} from "../../src";
import {AMOUNT_1M} from "../utils/constants";
import {ERC4626} from "../../src/models/erc4626";
import {expect} from "chai";

describe(`ERC4626`, () => {
  let web3Connection: Web3Connection;

  let erc20: ERC20;
  let erc4626Address: string;

  const cap = toSmartContractDecimals(AMOUNT_1M);
  const name =  `NAME`;
  const symbol = `$symbol`;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);

    const erc20Receipt = await erc20Deployer(name, symbol, cap, web3Connection);

    erc20 = new ERC20(web3Connection, erc20Receipt.contractAddress);
  });

  it(`Deploys`, async () => {
    erc4626Address =
      (await modelExtensionDeployer(web3Connection, ERC4626, [erc20.contractAddress]))?.contractAddress!;
    await increaseTime(1, web3Connection.Web3);
  })

  describe(`Integration`, () => {
    let erc4626: ERC4626;

    it(`Loads contracts`,async () => {
      erc4626 = new ERC4626(web3Connection, erc4626Address);
      await erc4626.loadContract();
    });

    it(`Asserts underlying ERC20`, () => {
      expect(erc4626.asset).to.not.be.null;
    });

    it(`Asserts underlying decimals`, () => {
      expect(erc4626.decimals).to.not.be.eq(-1);
    });

    it(`Approve underlying asset`, async () => {
      await hasTxBlockNumber(erc4626.approve(erc4626.contractAddress!, 10));
      expect(await erc4626.allowance(web3Connection.Account.address!, erc4626.contractAddress!)).to.be.eq('10');
    })
  });


})