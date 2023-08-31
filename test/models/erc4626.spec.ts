import {describe} from "mocha";
import {
  defaultWeb3Connection,
  erc20Deployer,
  hasTxBlockNumber,
  modelExtensionDeployer,
} from "../utils";
import {ERC20, Web3Connection} from "../../src";

import {ERC4626} from "../../src/models/token/ERC4626/erc4626";
import {expect} from "chai";
import {type Web3Account} from "web3-eth-accounts/lib/types";
import {getPrivateKeyFromFile} from "../utils/get-pvt-k-from-file";


describe(`ERC4626`, () => {
  let web3Connection: Web3Connection;

  let erc20: ERC20;

  let erc4626Address: string;
  let Owner: Web3Account;
  let Alice: Web3Account;
  let Bob: Web3Account;

  //const cap = toSmartContractDecimals(AMOUNT_1M);
  const name =  `NAME`;
  const symbol = `$symbol`;

  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);

    Owner = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile());
    Alice = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1));
    Bob = web3Connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(2));

    const erc20Receipt = await erc20Deployer(name, symbol, '0', web3Connection);

    erc20 = new ERC20(web3Connection, erc20Receipt.contractAddress);
    await erc20.start()
  });

  it(`Deploys`, async () => {
    erc4626Address =
      (await modelExtensionDeployer(web3Connection, ERC4626, [erc20.contractAddress, `NAME Vault`, `$symbol V`]))?.contractAddress!;
  })

  describe(`Integration`, () => {
    let erc4626: ERC4626;

    it(`Loads contracts`,async () => {
      erc4626 = new ERC4626(web3Connection, erc4626Address);
      await erc4626.start();
    });

    it(`Asserts underlying ERC20`, () => {
      expect(erc4626.asset).to.not.be.null;
      expect(erc4626.asset).to.not.be.eq(0);
    });

    it(`Asserts underlying decimals`, async () => {
      expect((await erc4626.decimals()).toString()).to.be.eq('18');
    });

    describe(`Simulates usage`, async () => {
      before(`Give tokens To Alice and Bob`, async () => {
        web3Connection.switchToAccount(Owner);
        await hasTxBlockNumber(erc20.mint(Alice.address, 4000));
        await hasTxBlockNumber(erc20.mint(Bob.address, 7001));
      })

      it(`Alice approves usage`, async () => {
        web3Connection.switchToAccount(Alice);
        await hasTxBlockNumber(erc20.approve(erc4626Address, 4000));
      });

      it(`Bob approves usage`, async () => {
        web3Connection.switchToAccount(Bob);
        await hasTxBlockNumber(erc20.approve(erc4626Address, 7001));
      });

      it (`Alice mints 2000 shares (costs 2000 erc20)`, async () => {
        web3Connection.switchToAccount(Alice.privateKey);
        expect(await erc4626.previewMint(2000)).to.be.eq('2000');
        await hasTxBlockNumber(erc4626.mint(2000, Alice.address));

        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('2000');
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('0');
      })

      it(`Bob mints 4000 shares (costs 4000 erc20) to himself`, async () => {
        web3Connection.switchToAccount(Bob.privateKey);
        expect(await erc4626.previewMint(4000)).to.be.eq('4000');
        expect(await erc4626.mint(4000, Bob.address));
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('4000');

        // Asserts that assets and total supply match deposits/mints
        expect(await erc4626.totalSupply()).to.be.eq('6000');
        expect(await erc4626.totalAssets()).to.be.eq('6000');
      })


      it(`Vault mutates by +3000 tokens (simulated yield returned from strategy)`, async () => {
        web3Connection.switchToAccount(Owner.privateKey);
        await hasTxBlockNumber(erc20.mint(erc4626Address, 3000));

        // Asserts that assets matches deposits/mints
        expect(await erc4626.totalSupply()).to.be.eq('6000');
        expect(await erc4626.totalAssets()).to.be.eq('9000');
      })


      it(`Alice deposits 2000 tokens (mints 1333 shares)`, async () => {
        web3Connection.switchToAccount(Alice.privateKey);
        expect(await erc4626.previewDeposit(2000)).to.be.eq('1333');
        await hasTxBlockNumber(erc4626.deposit(2000, Alice.address), `Alice deposits`);
        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('3333');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('4999');
        expect(await erc4626.totalSupply()).to.be.eq('7333');
        expect(await erc4626.totalAssets()).to.be.eq('11000');
      })


      it(`Bob mints 2000 shares (costs 3001 erc20)`, async () => {
        // NOTE: Bob's assets spent got rounded up
        // NOTE: Alice's vault assets got rounded up
        web3Connection.switchToAccount(Bob);
        expect(await erc4626.mint(2000, Bob.address));
        expect(await erc4626.balanceOf(Bob.address)).to.eq('6000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('4999');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('9000');
        expect(await erc4626.totalSupply()).to.be.eq('9333');
        expect(await erc4626.totalAssets()).to.be.eq('14000');
      })


      it(`Vault mutates by +3001 tokens`, async () => {
        web3Connection.switchToAccount(Owner);
        await hasTxBlockNumber(erc20.mint(erc4626Address, 3001));

        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('3333');
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('6000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('6071');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('10929');
        expect(await erc4626.totalSupply()).to.be.eq('9333');
        expect(await erc4626.totalAssets()).to.be.eq('17001');
      })

      it(`Alice redeem 1333 shares (2428 assets)`, async () => {
        web3Connection.switchToAccount(Alice);
        expect(await erc4626.previewRedeem(1333)).to.be.eq('2428');
        await hasTxBlockNumber(erc4626.redeem(1333, Alice.address, Alice.address), `Alice redeems`);
        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('2000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('3643');
        expect(await erc4626.totalSupply()).to.be.eq('8000');
        expect(await erc4626.totalAssets()).to.be.eq('14572');
      })

      it(`Bob withdraws 2929 assets (1608 shares)`, async () => {
        web3Connection.switchToAccount(Bob);
        await hasTxBlockNumber(erc4626.withdraw(2929, Bob.address, Bob.address), `Bob withdraws`);
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('4392');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('3643');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('8000');
        expect(await erc4626.totalSupply()).to.be.eq('6392');
        expect(await erc4626.totalAssets()).to.be.eq('11643');
      })

      it(`Alice withdraws 3643 assets (2000 shares)`, async () => {
        // NOTE: Bob's assets have been rounded back up
        web3Connection.switchToAccount(Alice);
        expect(await erc4626.previewWithdraw(3643)).to.be.eq('2000');
        await hasTxBlockNumber(erc4626.withdraw(3643, Alice.address, Alice.address), `Alice withdraws`);

        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('0');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('0');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('8000');
        expect(await erc4626.totalSupply()).to.be.eq('4392');
        expect(await erc4626.totalAssets()).to.be.eq('8000');
      })


      it(`Bob redeem 4392 shares (8000 tokens)`, async () => {
        web3Connection.switchToAccount(Bob);
        await hasTxBlockNumber(erc4626.redeem(4392, Bob.address, Bob.address), `Bob redeems`);
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('0');
        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('0');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('0');
        expect(await erc4626.totalSupply()).to.be.eq('0');
        expect(await erc4626.totalAssets()).to.be.eq('0');
      })
    });
  });
})