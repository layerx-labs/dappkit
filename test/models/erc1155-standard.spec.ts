import {defaultWeb3Connection, getPrivateKeyFromFile,} from '../utils/';
import {ERC1155Standard, Web3Connection} from '../../src';
import {expect} from 'chai';

describe(`ERC1155 Standard`, () => {
  let contract: ERC1155Standard;
  let web3Connection: Web3Connection;
  let contractAddress: string;
  const initial = {
    uri: 'https://my.token.uri'
  }
  before(async () => {
    try {
      web3Connection = await defaultWeb3Connection(true, true);
    } catch (error) {
      console.log('web3Connection error:>> ', error);
    }
  });

  it(`Deploys the contract`, async () => {
    const deployer = new ERC1155Standard(web3Connection);
    deployer.loadAbi();
    const tx = await deployer
      .deployJsonAbi('https://my.token.uri');
      expect(tx.blockNumber).to.exist;
      contractAddress = tx.contractAddress!;
  });

  describe(`Methods`, () => {
    before(async () => {
      try {
        contract = new ERC1155Standard(web3Connection, contractAddress!);
        await contract.loadContract();
      } catch (error) {
        console.log('Methods - before hook error :>> ', error);
      }
    });
   
    it(`Set a new URI for all tokens`, async () => {
      const uriBeforeSetting = await contract.uri(0)
      await contract.setURI("https://domain.tld/")
      const uriAfterSetting =await contract.uri(0)

      expect(uriBeforeSetting).to.have.string(initial.uri)
      expect(uriAfterSetting).to.have.string('https://domain.tld/')
    });

    it(`mints the token id`, async () => {
      const receiverAccount = web3Connection.Web3.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1));
      await contract.mint(receiverAccount.address, 0, 100, "0x12345678")

      expect(await contract.balanceOf(receiverAccount.address, 0)).to.be.eq(String(100))
    });

    it(`mints a bunch of token ids`, async () => {
      const receiverAccount = web3Connection.Web3.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1));
      const tokenIds = [123,212,344]
      const amounts = [100,200,300]
      await contract.mintBatch(receiverAccount.address, tokenIds, amounts, "0x12345678")

      for (const [index, tokenId] of tokenIds.entries()) {
        expect(await contract.balanceOf(receiverAccount.address, tokenId)).to.be.eq(String(amounts[index]))        
      }
    });

  });

});
