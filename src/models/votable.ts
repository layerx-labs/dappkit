import {Model} from '@base/model';
import {Web3Connection} from '@base/web3-connection';
import {Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {Deployable} from '@interfaces/deployable';
import {ERC20} from '@models/token/ERC20/erc20';
import {fromDecimals, toSmartContractDecimals} from '@utils/numbers';
import voterInfo from '@utils/models/voter-info';
import votingPollWinner from '@utils/models/voting-poll-winner';
import poolInformation from '@utils/models/pool-information';
import artifact from "@interfaces/generated/abi/Votable";
import {ContractConstructorArgs} from "web3-types/lib/types";

export class Votable extends Model<typeof artifact.abi> implements Deployable {
  constructor(web3Connection: Web3Connection|Web3ConnectionOptions,
              contractAddress?: string,
              readonly erc20TokenAddress?: string) {
    super(web3Connection, artifact.abi, contractAddress);
  }

  private _erc20!: ERC20;
  get erc20() { return this._erc20 }

  async loadContract() {
    if (!this.contract)
      return;

    const contractAddress = this.erc20TokenAddress || await this.callTx(this.contract.methods.erc20());
    this._erc20 = new ERC20(this.connection, contractAddress);
  }

  async start() {
    await super.start();
    await this.loadContract();
  }

  async deployJsonAbi(_token: string) {
    const deployOptions = {
        data: artifact.bytecode,
        arguments: [_token] as ContractConstructorArgs<typeof artifact.abi>
    };

    return this.deploy(deployOptions, this.connection.Account);
  }

  async pollCount() {
    return this.callTx(this.contract.methods.pollCount());
  }

  async polls(v1: number) {
    return this.callTx(this.contract.methods.polls(v1));
  }

  /**
   *
   * @param {string} _description description of the poll
   * @param {number} _voteLength length of the voting in seconds
   * @param {number[]} options available options
   */
  async createPoll(_description: string, _voteLength: number, options: number[]) {
    return this.sendTx(this.contract.methods.createPoll(_description, _voteLength, options));
  }

  async endPoll(_pollID: number) {
    return this.sendTx(this.contract.methods.endPoll(_pollID));
  }

  async getPoolInformation(_pollID: number) {
    return poolInformation(await this.callTx(this.contract.methods.getPoolInformation(_pollID)), _pollID);
  }

  async getPoolWinner(_pollID: number) {
    return votingPollWinner(await this.callTx(this.contract.methods.getPoolWinner(_pollID)));
  }

  async getPollOptionById(_pollID: number, id: number) {
    return this.callTx(this.contract.methods.getPollOptionById(_pollID, id));
  }

  async getPollHistory(_voter: string) {
    return this.callTx(this.contract.methods.getPollHistory(_voter));
  }

  async getPollInfoForVoter(_pollID: number, _voter: string) {
    return voterInfo(await this.callTx(this.contract
                                           .methods.getPollInfoForVoter(_pollID, _voter)), this.erc20.decimals);
  }

  async userHasVoted(_pollID: number, _user: string) {
    return this.callTx(this.contract.methods.userHasVoted(_pollID, _user));
  }

  async castVote(_pollID: number, _voteId: number) {
    return this.sendTx(this.contract.methods.castVote(_pollID, _voteId));
  }

  async stakeVotingTokens(_numTokens: number) {
    return this.sendTx(this.contract
                           .methods
                           .stakeVotingTokens(toSmartContractDecimals(_numTokens, this.erc20.decimals)));
  }

  async withdrawTokens(_numTokens: number) {
    return this.sendTx(this.contract
                           .methods.withdrawTokens(toSmartContractDecimals(_numTokens, this.erc20.decimals)));
  }

  async getLockedAmount(_voter: string) {
    return fromDecimals(await this.callTx(this.contract.methods.getLockedAmount(_voter)), this.erc20.decimals);
  }

  async getTokenStake(_voter: string) {
    return this.callTx(this.contract.methods.getTokenStake(_voter));
  }

}
