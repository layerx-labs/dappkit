import {describe} from "mocha";
import {
  defaultWeb3Connection,
  erc20Deployer,
  getPrivateKeyFromFile,
  hasTxBlockNumber,
  modelExtensionDeployer,
} from "../utils";
import {ERC20, toSmartContractDecimals, Web3Connection} from "../../src";
import {AMOUNT_1M, bn} from "../utils/constants";
import {ERC4626} from "../../src/models/erc4626";
import {expect} from "chai";
import {Account} from "web3-core";


describe(`ERC4626`, () => {
  let web3Connection: Web3Connection;

  let erc20: ERC20;

  let erc4626Address: string;
  let spender: Account;
  let Owner: Account;
  let Alice: Account;
  let Bob: Account;

  const cap = toSmartContractDecimals(AMOUNT_1M);
  const name =  `NAME`;
  const symbol = `$symbol`;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);

    Owner = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile());
    spender = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(3));
    Alice = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(5));
    Bob = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(6));

    const erc20Receipt = await erc20Deployer(name, symbol, cap, web3Connection);

    erc20 = new ERC20(web3Connection, erc20Receipt.contractAddress);
    await erc20.loadContract()
  });

  it(`Deploys`, async () => {
    // the used ERC20 is a 18 decimal one, so conversion is 1:1
    erc4626Address =
      (await modelExtensionDeployer(web3Connection, ERC4626, [erc20.contractAddress, `NAME Vault`, `$symbol V`]))?.contractAddress!;
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

    it(`Asserts underlying decimals`, async () => {
      expect(await erc4626.decimals()).to.be.eq('18');
    });

    it(`Approve underlying asset`, async () => {
      await hasTxBlockNumber(erc20.approve(erc4626.contractAddress!, 20));
      expect(await erc20.allowance(web3Connection.Account.address!, erc4626.contractAddress!)).to.be.eq('20');
      expect(await erc4626.approve(spender.address, 10))
    })


    it(`Simulates usage`, async () => {
      // Give 4000 tokens to Alice and 7001 to Bob
      await hasTxBlockNumber(erc20.mint(Alice.address, 4000));
      await hasTxBlockNumber(erc20.mint(Bob.address, 7001));

      web3Connection.switchToAccount(Alice.privateKey);
      await hasTxBlockNumber(erc20.approve(erc4626Address, 4000));

      web3Connection.switchToAccount(Bob.privateKey);
      await hasTxBlockNumber(erc20.approve(erc4626Address, 7001));

      // Alice mints 2000 shares (costs 2000 erc20)
      web3Connection.switchToAccount(Alice.privateKey);
      expect(await erc4626.previewMint(2000)).to.be.eq('2000');
      await hasTxBlockNumber(erc4626.mint(2000, Alice.address));

      expect(await erc4626.balanceOf(Alice.address)).to.be.eq('2000');
      expect(await erc4626.balanceOf(Bob.address)).to.be.eq('0');

      // Bob mints 4000 shares (costs 4000 erc20) to himself
      web3Connection.switchToAccount(Bob.privateKey);
      expect(await erc4626.previewMint(4000)).to.be.eq('4000');
      expect(await erc4626.mint(4000, Bob.address));
      expect(await erc4626.balanceOf(Bob.address)).to.be.eq('4000');

      // Asserts that assets and total supply match deposits/mints
      expect(await erc4626.totalSupply()).to.be.eq('6000');
      expect(await erc4626.totalAssets()).to.be.eq('6000');

      // Vault mutates by +3000 tokens (simulated yield returned from strategy)
      web3Connection.switchToAccount(Owner.privateKey);
      await hasTxBlockNumber(erc20.mint(erc4626Address, 3000));

      // Asserts that assets matches deposits/mints
      expect(await erc4626.totalAssets()).to.be.eq('9000');

      // Alice deposits 2000 tokens (mints 1337 shares)
      web3Connection.switchToAccount(Alice.privateKey);
      expect(await erc4626.deposit(2000, Alice.address));
      expect(await erc4626.balanceOf(Alice.address)).to.be.eq('3333');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Alice.address)).toNumber())).to.be.eq('4999');
      expect(await erc4626.totalSupply()).to.be.eq('7333');
      expect(await erc4626.totalAssets()).to.be.eq('11000');

      // Bob mints 2000 shares (costs 3001 erc20)
      // NOTE: Bob's assets spent got rounded up
      // NOTE: Alices's vault assets got rounded up
      web3Connection.switchToAccount(Bob);
      expect(await erc4626.mint(2000, Bob.address));

      expect(await erc4626.balanceOf(Bob.address)).to.eq('6000');

      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Alice.address)).toNumber())).to.be.eq('5000');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Bob.address)).toNumber())).to.be.eq('9000');
      expect(await erc4626.totalSupply()).to.be.eq('9333');
      expect(await erc4626.totalAssets()).to.be.eq('14001');

      // Vault mutates by +3000 tokens
      // NOTE: Vault holds 17001 tokens, but sum of assetsOf() is 17000.
      web3Connection.switchToAccount(Owner);
      await hasTxBlockNumber(erc20.mint(erc4626Address, 3000));

      expect(await erc4626.balanceOf(Alice.address)).to.be.eq('3333');
      expect(await erc4626.balanceOf(Bob.address)).to.be.eq('6000');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Alice.address)).toNumber())).to.be.eq('6071');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Bob.address)).toNumber())).to.be.eq('10929');
      expect(await erc4626.totalSupply()).to.be.eq('9333');
      expect(await erc4626.totalAssets()).to.be.eq('17001');

      // Alice redeem 1333 shares (2428 assets)
      web3Connection.switchToAccount(Alice);
      await hasTxBlockNumber(erc4626.redeem(1333, Alice.address, Alice.address));
      expect(await erc4626.balanceOf(Alice.address)).to.be.eq('2000');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Alice.address)).toNumber())).to.be.eq('3643');
      expect(await erc4626.totalSupply()).to.be.eq('8000');
      expect(await erc4626.totalAssets()).to.be.eq('14573');

      // Bob withdraws 2929 assets (1608 shares)
      web3Connection.switchToAccount(Bob);
      await hasTxBlockNumber(erc4626.withdraw(2929, Bob.address, Bob.address));
      expect(await erc4626.balanceOf(Bob.address)).to.be.eq('4392');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Bob.address)).toNumber())).to.be.eq('8000');
      expect(await erc4626.totalSupply()).to.be.eq('6392');
      expect(await erc4626.totalAssets()).to.be.eq('11644');

      // Alice withdraws 3643 assets (2000 shares)
      // NOTE: Bob's assets have been rounded back up
      web3Connection.switchToAccount(Alice);
      await hasTxBlockNumber(erc4626.withdraw(3643, Alice.address, Alice.address));

      expect(await erc4626.balanceOf(Alice.address)).to.be.eq('0');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Alice.address)).toNumber())).to.be.eq('0');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Bob.address)).toNumber())).to.be.eq('8001');
      expect(await erc4626.totalSupply()).to.be.eq('4392');
      expect(await erc4626.totalAssets()).to.be.eq('8001');

      // Bob redeem 4392 shares (8001 tokens)
      await hasTxBlockNumber(erc4626.redeem(4392, Bob.address, Bob.address));
      expect(await erc4626.balanceOf(Bob.address)).to.be.eq('0');
      expect(await erc4626.convertToAssets(bn(await erc4626.balanceOf(Bob.address)).toNumber())).to.be.eq('0');
      expect(await erc4626.totalSupply()).to.be.eq('0');
      expect(await erc4626.totalAssets()).to.be.eq('0');

    });
  });


})