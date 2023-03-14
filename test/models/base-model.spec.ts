import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Web3Connection} from '@base/web3-connection';
import {Model} from '@base/model';
import {expect} from 'chai';
import {Errors} from '@interfaces/error-enum';
import {getPrivateKeyFromFile, shouldBeRejected} from '../utils/';
import erc20 from "../../build/contracts/ERC20.json";

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
      const model = new Model(web3Connection, erc20.abi as any);

      const tx =
        await model.deploy({data: erc20.bytecode, arguments: ["name", "symbol"]}, web3Connection.Account);

      expect(model.contract.abi).to.exist;
      expect(tx.blockNumber).to.exist;
      expect(tx.contractAddress).to.exist;
      expect(model.contractAddress).to.be.eq(tx.contractAddress);
      deployedAddress = tx.contractAddress;

    });

    it(`Starts but can't interact, only read because no pvtkey`, async () => {
      const model = new Model({...options, privateKey: undefined, autoStart: true}, erc20.abi as any, deployedAddress);
      expect(await model.callTx(model.contract.methods.name())).to.be.eq('name');
      const AliceAddress = model.web3.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1)).address;
      await shouldBeRejected(model.sendTx(model.contract.methods.transfer(AliceAddress, '10')))
    })
  })
})
