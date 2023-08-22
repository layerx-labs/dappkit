import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Web3Connection} from '@base/web3-connection';
import {Model} from '@base/model';
import {expect} from 'chai';
import {Errors} from '@interfaces/error-enum';
import {getPrivateKeyFromFile, hasTxBlockNumber, shouldBeRejected} from '../utils/';
import erc20 from "../../src/interfaces/generated/abi/Token";
import {ERC20} from "../../src";

describe(`Model<any>`, () => {
  let deployedAddress: string;

  const options: Web3ConnectionOptions = {
    web3Host: process.env.WEB3_HOST_PROVIDER || 'HTTP://127.0.0.1:8545',
    privateKey: process.env.WALLET_PRIVATE_KEY || getPrivateKeyFromFile(),
    skipWindowAssignment: true,
    autoStart: false,
  }

  it(`throws because no Abi`, () => {
    const web3Connection = new Web3Connection(options);

    expect(() => new Model(web3Connection, []))
      .to.throw(Errors.MissingAbiInterfaceFromArguments);

    expect(() => new Model(web3Connection, undefined as any))
      .to.throw(Errors.MissingAbiInterfaceFromArguments);
  });

  it(`Does not load abi if no autoStart`, () => {
    const web3Connection = new Web3Connection(options);
    const model = new Model(web3Connection, erc20.abi as any);
    expect(model.contract).to.be.undefined;
  });

  describe(`with autoStart: true`, () => {
    it(`Starts and loads the ABI automatically and re-assigns`, async () => {
      const web3Connection = new Web3Connection({...options, autoStart: true});
      const model = new Model(web3Connection, erc20.abi);

      console.log(await web3Connection.getAddress())

      const tx =
        await hasTxBlockNumber(model.deploy({data: erc20.bytecode, arguments: ["name", "symbol", 1, await web3Connection.getAddress()] as any} as any, web3Connection.Account));

      expect(model.contract.abi).to.exist;
      expect(tx.blockNumber).to.exist;
      expect(tx.contractAddress).to.exist;
      expect(model.contractAddress).to.be.eq(tx.contractAddress);
      deployedAddress = tx.contractAddress;

    });

    it(`Starts but can't interact, only read because no pvtkey`, async () => {
      const model = new Model({...options, privateKey: undefined, autoStart: true}, erc20.abi, deployedAddress);
      expect(await model.callTx(model.contract.methods.name())).to.be.eq('name');
      const AliceAddress = model.connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1)).address;
      await shouldBeRejected(model.sendTx(model.contract.methods.transfer(AliceAddress, '10')))
    })

    it(`should await the start of a custom model after deploy`, async () => {
      const model = new ERC20({...options, autoStart: true});
      const BobAddress = model.connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(0)).address;
      const AliceAddress = model.connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1)).address;

      await hasTxBlockNumber(model.deployJsonAbi("name", "symbol", "2000000000000000000", BobAddress));
      await hasTxBlockNumber(model.transfer(AliceAddress, 1));
      expect(await model.name()).to.be.eq(`name`)
    })
  })
})
