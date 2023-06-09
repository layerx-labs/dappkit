import {defaultWeb3Connection, getPrivateKeyFromFile} from "../utils";
import {ERC20, toSmartContractDecimals,} from "../../src";
import {expect, spy, use} from "chai";
import chaiSpies from 'chai-spies';

use(chaiSpies)

describe("Web3Contract - Custom options", () => {

  it("asserts singedTxHandler and customTransactionHandler option", async () => {
    // @ts-ignore
    const customTransactionHandler = async (e: any, solve: (data: any) => void) => { await e; solve([]) };
    const signedTxHandler = spy();

    const connection = await defaultWeb3Connection(true, false, {customTransactionHandler, signedTxHandler, restartModelOnDeploy: true});
    const token = new ERC20(connection);

    const Alice = connection.eth.accounts.privateKeyToAccount(getPrivateKeyFromFile(1));

    const txHandlerSpy = spy.on(connection.options, 'customTransactionHandler');

    await token.start();
    await token.deployJsonAbi("token", "tkn", toSmartContractDecimals(10), await connection.getAddress());
    await token.transfer(Alice.address, 1);

    expect(token.contractAddress).to.exist;
    expect(txHandlerSpy, 'txHandler called').to.have.been.called.once;
    expect(signedTxHandler, 'signedHandler called').to.have.been.called.once;

  });

});