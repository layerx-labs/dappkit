import {
  defaultWeb3Connection,
  getPrivateKeyFromFile,
  shouldBeRejected,
} from '../utils';
import { ERC1155Ownable, Web3Connection } from '../../src';
import { expect } from 'chai';
import { Account } from 'web3-core';

describe(`ERC1155 Ownable`, () => {
  let contract: ERC1155Ownable;
  let web3Connection: Web3Connection;
  let contractAddress: string;
  let bob: Account;
  let alice: Account;

  const initial = {
    uri: 'https://my.token.uri',
  };
  before(async () => {
    web3Connection = await defaultWeb3Connection(true, true);
    bob = web3Connection.Web3.eth.accounts.privateKeyToAccount(
      getPrivateKeyFromFile(1)
    );
    alice = web3Connection.Web3.eth.accounts.privateKeyToAccount(
      getPrivateKeyFromFile(0)
    );
  });

  it(`Deploys the contract`, async () => {
    const deployer = new ERC1155Ownable(web3Connection);
    deployer.loadAbi();
    const tx = await deployer.deployJsonAbi('https://my.token.uri');
    expect(tx.blockNumber).to.exist;
    contractAddress = tx.contractAddress!;
  });

  describe(`Methods`, () => {
    before(async () => {
      contract = new ERC1155Ownable(web3Connection, contractAddress!);
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
      await contract.mint(bob.address, 0, 100, '0x12345678');
      expect(await contract.balanceOf(bob.address, 0)).to.be.eq(100);
    });

    it(`mints a bunch of token ids`, async () => {
      const tokenIds = [123, 212, 344];
      const amounts = [100, 200, 300];
      await contract.mintBatch(bob.address, tokenIds, amounts, '0x12345678');

      const expectedAmounts = await contract.balanceOfBatch(
        [bob.address, bob.address, bob.address],
        tokenIds
      );

      expect(expectedAmounts[0]).to.be.eq(amounts[0]);
      expect(expectedAmounts[1]).to.be.eq(amounts[1]);
      expect(expectedAmounts[2]).to.be.eq(amounts[2]);
    });

    describe('Account address different from owner', () => {
      before(async () => {
        contract.connection.switchToAccount(bob.privateKey);
      });

      it(`'setURI' reverts the transaction: OR => OwnerRequired`, async () => {
        const uriBeforeSetting = await contract.uri(0);
        await shouldBeRejected(contract.setURI('https://bob.domain/'), 'OR');
        expect(uriBeforeSetting).to.have.string(await contract.uri(0));
      });

      it(`'mint' reverts the transaction: OR => OwnerRequired`, async () => {
        await shouldBeRejected(
          contract.mint(alice.address, 0, 100, '0x12345678'),
          'OR'
        );
        expect(await contract.balanceOf(alice.address, 0)).to.not.eq(100);
      });

      it(`'mintBatch' reverts the transaction: OR => OwnerRequired`, async () => {
        await shouldBeRejected(
          contract.mintBatch(alice.address, [0, 1], [500, 600], '0x12345678'),
          'OR'
        );
        const expectedAmounts = await contract.balanceOfBatch(
          [alice.address, alice.address],
          [0, 1]
        );
        expect(expectedAmounts[0]).to.not.eq(500);
        expect(expectedAmounts[1]).to.not.eq(600);
      });
    });
  });
});
