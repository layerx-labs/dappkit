import { defaultWeb3Connection, getPrivateKeyFromFile } from '../utils';
import { ERC1155Standard, Web3Connection } from '../../src';
import { expect } from 'chai';
import { Account } from 'web3-core';

describe(`ERC1155 Standard`, () => {
  let contract: ERC1155Standard;
  let web3Connection: Web3Connection;
  let contractAddress: string;
  let alice: Account;
  const initial = {
    uri: 'https://my.token.uri',
  };
  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
    alice = web3Connection.Web3.eth.accounts.privateKeyToAccount(
      getPrivateKeyFromFile(0)
    );
  });

  it(`Deploys the contract`, async () => {
    const deployer = new ERC1155Standard(web3Connection);
    deployer.loadAbi();
    const tx = await deployer.deployJsonAbi('https://my.token.uri');
    expect(tx.blockNumber).to.exist;
    contractAddress = tx.contractAddress!;
  });

  describe(`Methods`, () => {
    before(async () => {
      contract = new ERC1155Standard(web3Connection, contractAddress!);
      await contract.start();
    });

    it(`Set a new URI for all tokens`, async () => {
      const uriBeforeSetting = await contract.uri(0);
      await contract.setURI('https://domain.tld/');
      const uriAfterSetting = await contract.uri(0);

      expect(uriBeforeSetting).to.have.string(initial.uri);
      expect(uriAfterSetting).to.have.string('https://domain.tld/');
    });

    it(`mints the token id`, async () => {
      await contract.mint(alice.address, 0, 100, '0x12345678');
      expect(await contract.balanceOf(alice.address, 0)).to.be.eq(100);
    });

    it(`mints a bunch of token ids`, async () => {
      const tokenIds = [123, 212, 344];
      const amounts = [100, 200, 300];
      await contract.mintBatch(alice.address, tokenIds, amounts, '0x12345678');

      const expectedAmounts = await contract.balanceOfBatch(
        [alice.address, alice.address, alice.address],
        tokenIds
      );

      expect(expectedAmounts[0]).to.be.eq(amounts[0]);
      expect(expectedAmounts[1]).to.be.eq(amounts[1]);
      expect(expectedAmounts[2]).to.be.eq(amounts[2]);
    });
  });
});
