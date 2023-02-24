import {defaultWeb3Connection, erc20Deployer, expectEvent} from "./index";
import {Web3Connection} from "../../src";
import {nativeZeroAddress} from "../../src/utils/constants";

describe(`parseReceiptLogs`, () => {

  const deploy_amount = `10000`;


  let connection: Web3Connection;

  before(async () => {
    connection = await defaultWeb3Connection(true, true);
  });

  it(`Deploys ERC20 and expect transfer log event`, async () => {
    await expectEvent(
      erc20Deployer(`name`, `symbol`, deploy_amount, connection),
      `Transfer`, {from: nativeZeroAddress, to: await connection.getAddress(), value: deploy_amount});
  })
})