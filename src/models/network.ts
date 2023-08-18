import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import * as NetworkAbi from '@abi/Network.json';
import {ERC20} from '@models/erc20';
import {fromDecimals, toSmartContractDecimals} from '@utils/numbers';
import {TransactionReceipt} from '@interfaces/web3-core';
import networkIssue from '@utils/network-issue';
import {NetworkIssue} from '@interfaces/network-issue';
import networkMerge from '@utils/network-merge';
import {Errors} from '@interfaces/error-enum';
import {Deployable} from '@interfaces/deployable';
import {NetworkMethods} from '@methods/network';
import {OraclesSummary} from '@interfaces/oracles-summary';
import {AbiItem} from 'web3-utils';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {PastEventOptions} from 'web3-eth-contract';

export class Network extends Model<typeof artifact> implements Deployable {
  private _transactionToken!: ERC20;
  private _settlerToken!: ERC20;
  get transactionToken() { return this._transactionToken; }
  get settlerToken() { return this._settlerToken; }

  constructor(web3Connection: Web3Connection|Web3ConnectionOptions, contractAddress?: string) {
    super(web3Connection, NetworkAbi.abi as AbiItem[], contractAddress);
  }

  async getTransactionTokenAddress() {
    return this.callTx(await this.contract.methods.transactionToken());
  }

  async getSettlerTokenAddress() {
    return this.callTx(await this.contract.methods.settlerToken());
  }

  async getIssuesByAddress(address: string) {
    const ids = await this.callTx(await this.contract.methods.getIssuesByAddress(address));
    return ids.map(id => +id);
  }

  async getAmountOfIssuesOpened(): Promise<number> {
    return +(await this.callTx(await this.contract.methods.incrementIssueID()));
  }

  async getAmountOfIssuesClosed() {
    return +(await this.callTx(await this.contract.methods.closedIdsCount()));
  }

  async getOraclesByAddress(address: string) {
    return fromDecimals(await this.callTx(await this.contract
                                                     .methods
                                                     .getOraclesByAddress(address)), this.settlerToken.decimals);
  }

  async getOraclesSummary(address: string): Promise<OraclesSummary> {
    const {'0': oraclesDelegatedByOthers, '1': amounts, '2': addresses, '3': tokensLocked} =
      await this.callTx(await this.contract.methods.getOraclesSummary(address));


    const decimals = this.settlerToken.decimals;

    return {
      oraclesDelegatedByOthers: fromDecimals(oraclesDelegatedByOthers, this.settlerToken.decimals),
      amounts: amounts.map((amount: number) => fromDecimals(amount, decimals)),
      addresses,
      tokensLocked: fromDecimals(tokensLocked, decimals),
    }
  }

  async percentageNeededForDispute() {
    return +(await this.callTx(this.contract.methods.percentageNeededForDispute()));
  }

  async mergeCreatorFeeShare() {
    return +(await this.callTx(this.contract.methods.mergeCreatorFeeShare()));
  }

  async disputesForMergeByAddress(issueId: number, proposalId: number, address: string) {
    return +(await this.callTx(this.contract.methods.disputesForMergeByAddress(issueId, proposalId, address)));
  }

  async disputableTime() {
    return +(await this.callTx(this.contract.methods.disputableTime()));
  }

  async redeemTime() {
    return +(await this.callTx(this.contract.methods.redeemTime()))
  }

  async getTokensStaked() {
    return fromDecimals(await this.callTx(this.contract.methods.totalStaked()), this.transactionToken.decimals);
  }

  async getBEPROStaked() {
    return fromDecimals(await this.callTx(this.contract.methods.oraclesStaked()), this.settlerToken.decimals)
  }

  async COUNCIL_AMOUNT() {
    return fromDecimals(await this.callTx(this.contract.methods.COUNCIL_AMOUNT()), this.settlerToken.decimals);
  }

  async isCouncil(address: string): Promise<boolean> {
    return await this.getOraclesByAddress(address) >= await this.COUNCIL_AMOUNT();
  }

  async changeCouncilAmount(value: string) {
    const amount = toSmartContractDecimals(value, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.changeCOUNCIL_AMOUNT(amount));
  }

  async changeRedeemTime(amount: number) {
    return this.sendTx(this.contract.methods.changeRedeemTime(amount as number));
  }

  async changeDisputableTime(amount: number) {
    return this.sendTx(this.contract.methods.changeDisputableTime(amount));
  }

  async isIssueInDraft(issueId: number) {
    return !!(await this.callTx(this.contract.methods.isIssueInDraft(issueId)));
  }

  async isMergeDisputed(issueId: number, mergeId: number) {
    return !!(await this.callTx(this.contract.methods.isMergeDisputed(issueId, mergeId)));
  }

  async isMergeInDraft(id: number, mergeId: number) {
    return !!(await this.callTx(this.contract.methods.isMergeInDraft(id, mergeId)))
  }

  async getIssueByCID(cid: string): Promise<NetworkIssue> {
    return networkIssue(await this.callTx(this.contract.methods.getIssueByCID(cid)), this.transactionToken.decimals);
  }

  async getIssueById(id: number): Promise<NetworkIssue> {
    return networkIssue(await this.callTx(this.contract
                                              .methods.getIssueById(id)), this.transactionToken.decimals);
  }

  async getMergeById(issueId: number, mergeId: number): Promise<any> {
    return networkMerge(await this.callTx(this.contract
                                              .methods.getMergeById(issueId, mergeId)), this.transactionToken.decimals)
  }

  async approveSettlerERC20Token(amount?: string | number, address = this.contractAddress!) {
    if (!amount)
      amount = await this.settlerToken.totalSupply();

    return this.settlerToken.approve(address, amount);
  }

  async approveTransactionalERC20Token(amount?: string | number, address = this.contractAddress!) {
    if (!amount)
      amount = await this.transactionToken.totalSupply();

    return this.transactionToken.approve(address, amount)
  }

  async isApprovedSettlerToken(amount: number, address: string = this.contractAddress!) {
    return this.settlerToken.isApproved(address, amount)
  }

  async isApprovedTransactionalToken(amount: number, address: string = this.contractAddress!) {
    return this.transactionToken.isApproved(address, amount)
  }

  async lock(amount: string | number): Promise<TransactionReceipt> {
    if (amount <= 0)
      throw new Error(Errors.AmountNeedsToBeHigherThanZero);

    amount = toSmartContractDecimals(amount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.lock(amount))
  }

  async unlock(amount: string | number, from: string) {
    if (amount <= 0)
      throw new Error(Errors.AmountNeedsToBeHigherThanZero);

    amount = toSmartContractDecimals(amount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.unlock(amount, from))
  }

  async delegateOracles(amount: string | number, delegateTo: string) {
    if (amount <= 0)
      throw new Error(Errors.AmountNeedsToBeHigherThanZero);

    amount = toSmartContractDecimals(amount, this.transactionToken.decimals);
    return this.sendTx(this.contract.methods.delegateOracles(amount, delegateTo))
  }

  async openIssue(cid: string, amount: string | number) {
    if (amount <= 0)
      throw new Error(Errors.AmountNeedsToBeHigherThanZero);

    amount = toSmartContractDecimals(amount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.openIssue(cid, amount))
  }

  async updateIssue(id: number, amount: string | number) {
    amount = toSmartContractDecimals(amount, this.settlerToken.decimals);
    return this.sendTx(this.contract.methods.updateIssue(id, amount))
  }

  async recognizeAsFinished(id: number) {
    return this.sendTx(this.contract.methods.recognizeAsFinished(id))
  }

  async redeemIssue(id: number) {
    return this.sendTx(this.contract.methods.redeemIssue(id))
  }

  async closeIssue(id: number, mergeId: number) {
    return this.sendTx(this.contract.methods.closeIssue(id, mergeId))
  }

  async disputeMerge(id: number, mergeId: number) {
    return this.sendTx(this.contract.methods.disputeMerge(id, mergeId))
  }

  async proposeIssueMerge(id: number, prAddresses: string[], prAmounts: number[]) {
    const mapToSmartContract = (amount: number) =>
      toSmartContractDecimals(amount, this.transactionToken.decimals)

    const amounts = prAmounts.map(mapToSmartContract);

    return this.sendTx(this.contract.methods.proposeIssueMerge(id, prAddresses, amounts))
  }

  async start() {
    await super.start();

    if (!this.contract)
      return;

    const transactionAddress = await this.getTransactionTokenAddress();
    const settlerAddress = await this.getSettlerTokenAddress();

    this._transactionToken = new ERC20(this.connection, transactionAddress);
    this._settlerToken = new ERC20(this.connection, settlerAddress);

    await this._transactionToken.start();
    await this._settlerToken.start();
  }


  deployJsonAbi(settlerAddress: string, transactionalAddress: string, governanceAddress: string) {

    const deployOptions = {
      data: NetworkAbi.bytecode,
      arguments: [settlerAddress, transactionalAddress, governanceAddress]
    }

    return this.deploy(deployOptions, this.connection.Account);
  }

  async getCloseIssueEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`CloseIssue`, filter)
  }

  async getDisputeMergeEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`DisputeMerge`, filter)
  }

  async getGovernorTransferredEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`GovernorTransferred`, filter)
  }

  async getMergeProposalCreatedEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`MergeProposalCreated`, filter)
  }

  async getOpenIssueEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`OpenIssue`, filter)
  }

  async getPausedEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`Paused`, filter)
  }

  async getRecognizedAsFinishedEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`RecognizedAsFinished`, filter)
  }

  async getRedeemIssueEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`RedeemIssue`, filter)
  }

  async getUnpausedEvents(filter: PastEventOptions) {
    return this.contract.self.getPastEvents(`Unpaused`, filter)
  }

}
