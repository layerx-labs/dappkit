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
        await hasTxBlockNumber(erc20.mint(Alice.address, 6000));
        await hasTxBlockNumber(erc20.mint(Bob.address, 6000));
      })

      it(`Alice approves usage`, async () => {
        web3Connection.switchToAccount(Alice);
        await hasTxBlockNumber(erc20.approve(erc4626Address, 6000));
      });

      it(`Bob approves usage`, async () => {
        web3Connection.switchToAccount(Bob);
        await hasTxBlockNumber(erc20.approve(erc4626Address, 6000));
      });

      it (`Alice mints 2000 shares (costs 2000 erc20)`, async () => {
        web3Connection.switchToAccount(Alice.privateKey);
        expect(await erc4626.previewMint(2000)).to.be.eq('2000.000000000000000000');
        await hasTxBlockNumber(erc4626.mint(2000, Alice.address));

        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('2000.000000000000000000');
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('0.000000000000000000');
      })

      it(`Bob mints 2000 shares (costs 2000 erc20) to himself`, async () => {
        web3Connection.switchToAccount(Bob.privateKey);
        expect(await erc4626.previewMint(2000)).to.be.eq('2000.000000000000000000');
        expect(await erc4626.mint(2000, Bob.address));
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('2000.000000000000000000');

        // Asserts that assets and total supply match deposits/mints
        expect(await erc4626.totalSupply()).to.be.eq('4000.000000000000000000');
        expect(await erc4626.totalAssets()).to.be.eq('4000.000000000000000000');
      })


      it(`Vault mutates by +2000 tokens (simulated yield returned from strategy)`, async () => {
        web3Connection.switchToAccount(Owner.privateKey);
        await hasTxBlockNumber(erc20.mint(erc4626Address, 2000));

        // Asserts that assets matches deposits/mints
        expect(await erc4626.totalSupply()).to.be.eq('4000.000000000000000000');
        expect(await erc4626.totalAssets()).to.be.eq('6000.000000000000000000');
      })


      it(`Alice deposits 3000 tokens (mints 2000 shares)`, async () => {
        web3Connection.switchToAccount(Alice.privateKey);
        expect(await erc4626.previewDeposit(3000)).to.be.eq('2000.000000000000000000');
        await hasTxBlockNumber(erc4626.deposit(3000, Alice.address), `Alice deposits`);
        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('4000.000000000000000000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('6000.000000000000000000');
        expect(await erc4626.totalSupply()).to.be.eq('6000.000000000000000000');
        expect(await erc4626.totalAssets()).to.be.eq('9000.000000000000000000');
      })


      it(`Bob mints 1000 shares (costs 1500 erc20)`, async () => {
        web3Connection.switchToAccount(Bob);
        expect(await erc4626.mint(1000, Bob.address));
        expect(await erc4626.balanceOf(Bob.address)).to.eq('3000.000000000000000000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('6000.000000000000000000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('4500.000000000000000000');
        expect(await erc4626.totalSupply()).to.be.eq('7000.000000000000000000');
        expect(await erc4626.totalAssets()).to.be.eq('10500.000000000000000000');
      })


      it(`Vault again mutates by +4500 tokens`, async () => {
        web3Connection.switchToAccount(Owner);
        await hasTxBlockNumber(erc20.mint(erc4626Address, 4500));

        expect(await erc4626.totalSupply()).to.be.eq('7000.000000000000000000');
        expect(await erc4626.totalAssets()).to.be.eq('15000.000000000000000000');
      })

      it(`Alice redeem 2000 shares (4280 assets)`, async () => {
        web3Connection.switchToAccount(Alice);
        expect(await erc4626.previewRedeem(2000)).to.be.eq('4285.714285714285714285');
        await hasTxBlockNumber(erc4626.redeem(2000, Alice.address, Alice.address), `Alice redeems`);
        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('2000.000000000000000000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('4285.714285714285714286');
        expect(await erc4626.totalSupply()).to.be.eq('5000.000000000000000000');
        expect(await erc4626.totalAssets()).to.be.eq('10714.285714285714285715');
      })

      it(`Bob withdraws 4280 assets (2000 shares)`, async () => {
        web3Connection.switchToAccount(Bob);
        expect(await erc4626.previewWithdraw(4280)).to.be.eq('1997.333333333333333334')
        await hasTxBlockNumber(erc4626.withdraw(4280, Bob.address, Bob.address), `Bob withdraws`);
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('1002.666666666666666666');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('4285.714285714285714287');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('2148.571428571428428572');
        expect(await erc4626.totalSupply()).to.be.eq('3002.666666666666666666');
        expect(await erc4626.totalAssets()).to.be.eq('6434.285714285714285715');
      })

      it(`Alice withdraws rest of shares`, async () => {
        web3Connection.switchToAccount(Alice);
        const maxWithdraw = await erc4626.maxWithdraw(Alice.address);
        expect(await erc4626.previewWithdraw(maxWithdraw)).to.be.eq('2000.000000000000000000');
        await hasTxBlockNumber(erc4626.withdraw(maxWithdraw, Alice.address, Alice.address), `Alice withdraws`);

        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('0.000000000000000000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Alice.address)))).to.be.eq('0.000000000000000000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('2148.571428571428428572');
        expect(await erc4626.totalSupply()).to.be.eq('1002.666666666666666666');
        expect(await erc4626.totalAssets()).to.be.eq('2148.571428571428571428');
      })


      it(`Bob redeem rest of shares`, async () => {
        web3Connection.switchToAccount(Bob);
        const maxRedeem = await erc4626.maxRedeem(Bob.address);
        await hasTxBlockNumber(erc4626.redeem(maxRedeem, Bob.address, Bob.address), `Bob redeems`);
        expect(await erc4626.balanceOf(Bob.address)).to.be.eq('0.000000000000000000');
        expect(await erc4626.balanceOf(Alice.address)).to.be.eq('0.000000000000000000');
        expect(await erc4626.convertToAssets(+(await erc4626.balanceOf(Bob.address)))).to.be.eq('0.000000000000000000');
        expect(await erc4626.totalSupply()).to.be.eq('0.000000000000000000');
        expect(await erc4626.totalAssets()).to.be.eq('0.000000000000000000');
      })
    });
  });
})