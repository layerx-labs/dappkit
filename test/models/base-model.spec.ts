import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Web3Connection} from '@base/web3-connection';
import {Model} from '@base/model';
import {expect} from 'chai';
import {Errors} from '@interfaces/error-enum';
import {hasTxBlockNumber, shouldBeRejected} from '../utils/';
import erc20 from "../../src/interfaces/generated/abi/ERC20CappedToken";
import {ERC20} from "../../src";
import {getPrivateKeyFromFile} from "../utils";

describe(`Model<any>`, () => {
  let deployedAddress: string;

  const options: Web3ConnectionOptions = {
    web3Host: process.env.CI_WEB3_HOST_PROVIDER || 'HTTP://127.0.0.1:8545',
    privateKey: getPrivateKeyFromFile(),
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
    let web3Connection: Web3Connection;
    before(() => {
      web3Connection = new Web3Connection({...options, autoStart: true});
    })

    it(`Starts and loads the ABI automatically and re-assigns`, async () => {
      const model = new Model(web3Connection, erc20.abi);

      const tx =
        await hasTxBlockNumber(model.deploy({data: erc20.bytecode, arguments: ["name", "symbol", "1000", await web3Connection.getAddress()] as any} as any, web3Connection.Account));

      expect(model.contract.abi).to.exist;
      expect(tx.blockNumber).to.exist;
      expect(tx.contractAddress).to.exist;
      expect(model.contractAddress).to.be.eq(tx.contractAddress);
      deployedAddress = tx.contractAddress;

    });

    it(`Starts but can't interact, only read because no pvtkey`, async () => {
      const model = new Model<typeof erc20.abi>({...options, privateKey: undefined, autoStart: true}, erc20.abi, deployedAddress);
      expect(await model.contract.methods.name().call()).to.be.eq('name');
      const AliceAddress = model.connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1)).address;
      await shouldBeRejected(model.sendTx(model.contract.methods.transfer(AliceAddress, '10')))
    })

    it(`should await the start of a custom model after deploy`, async () => {
      const model = new ERC20({...options, autoStart: true});
      await model.start()
      const AliceAddress = model.connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1)).address;

      await hasTxBlockNumber(model.deployJsonAbi("name", "symbol", "2000000000000000000"));
      await hasTxBlockNumber(model.transfer(AliceAddress, 1));
      expect(await model.name()).to.be.eq(`name`)
    })
  })

  describe(`With confirmations > 1`, () => {
    it("Waits for 2nd confirmation", async () => {
      const model = new Model({...options, autoStart: true, confirmations: 2}, erc20.abi);
      const web3Connection = model.connection;

      let tx;

      (async () => {
        tx = await model.deploy({data: erc20.bytecode, arguments: ["name", "symbol", "1000", await web3Connection.getAddress()] as any} as any, web3Connection.Account);
      })();

      await new Promise((resolve) => setTimeout(resolve, 3000));
      await hasTxBlockNumber(Promise.resolve(tx))

    })
  })
})
