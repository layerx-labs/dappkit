import Web3, {Personal, Web3BaseProvider, type Web3BaseWalletAccount, Web3EthInterface} from 'web3';
import {Errors} from '@interfaces/error-enum';
import {type Web3ConnectionOptions} from '@interfaces/web3-connection-options';
import {type SupportedProviders} from "web3-types/src/web3_base_provider";
import {fromSmartContractDecimals} from "@utils/numbers";

export class Web3Connection {
  protected web3!: Web3;

  /* account should be used when dealing with privateKey accounts */
  protected account!: Web3BaseWalletAccount;
  get Account() { return this.account; }

  /* eslint-disable complexity */
  constructor(readonly options: Web3ConnectionOptions) {
    const {web3CustomProvider: provider = null, autoStart = true, restartModelOnDeploy} = options;

    if (restartModelOnDeploy === undefined)
      this.options.restartModelOnDeploy = true;

    const providerConnected = provider &&
      typeof provider !== "string"
      && provider.hasOwnProperty('connected')
      && (provider as unknown as {connected: boolean}).connected;

    if (autoStart || providerConnected)
      this.start();
  }
  /* eslint-enable complexity */

  get started() { return !!this.web3; }
  get eth() { return this.web3?.eth; }
  get utils() { return this.web3?.utils; }
  get Web3() { return this.web3; }

  /* Account should be used when dealing with browser-accounts */
  get Personal() { return (this.web3.eth as Web3EthInterface & {personal: Personal}).personal; }

  async getAddress(): Promise<string> {
    return this.account ? this.account.address : ((await this.Personal.getAccounts()) || [""])[0];
  }

  async getBalance(ofAddress?: string): Promise<string> {
    return fromSmartContractDecimals(await this.eth?.getBalance(ofAddress || await this.getAddress()));
  }

  async getETHNetworkId(): Promise<bigint> {
    return this.eth?.net.getId();
  }

  /**
   * Request user to connect web3 plugin with the provider (and assign window.web3)
   */
  async connect(): Promise<boolean> {
    if (typeof window === 'undefined')
      throw new Error(Errors.WindowObjectNotFound);

    if (!(window as any).ethereum)
      throw new Error(Errors.NoEthereumObjectFoundOnWindow);

    await (window as any).ethereum.request({method: 'eth_requestAccounts'})
    this.web3 = new Web3((window as any).ethereum)

    this.web3.eth.handleRevert = false;
    this.web3.eth.contractDataInputFill = "both";
    this.web3.eth.transactionBlockTimeout = 200;

    if (!this.options.skipWindowAssignment)
      (window as any).web3 = this.web3;

    return true;
  }

  /**
   * change the privateKey prop of {@link Web3ConnectionOptions} and start a new connection
   */
  switchToAccount(account: string|Web3BaseWalletAccount) {
    const pvtKey = typeof account === "string" ? account : account.privateKey;
    if (this.options.privateKey !== pvtKey)
      this.options.privateKey = pvtKey;
    return this.start(true)
  }

  /* eslint-disable complexity */
  /**
   * Start a connection (and load an account if {@link Web3ConnectionOptions.privateKey} was provided) to the provider
   */
  start(restart = false): void {
    if (this.started && !restart)
      return;

    const {web3Host = ``, net = undefined, web3CustomProvider = undefined} = this.options;
    let provider: SupportedProviders<never>|undefined = web3CustomProvider;

    if (!web3Host && !provider)
      throw new Error(Errors.MissingWeb3ProviderHost)

    const web3Link = web3Host?.toLowerCase();

    if (!provider) {
      if (web3Link.includes(`http`))
        provider = new Web3.providers.HttpProvider(web3Link, net);
      else if (web3Link.includes(`ws`))
        provider = new Web3.providers.WebsocketProvider(web3Link, net);
    }

    if (!provider)
      throw new Error(Errors.FailedToAssignAProvider);

    this.web3 = new Web3(provider as Web3BaseProvider);
    if (!this.options.skipWindowAssignment && typeof window !== 'undefined')
      (window as any).web3 = this.web3;

    if (this.options.privateKey)
      this.account = this.web3.eth.accounts.privateKeyToAccount(this.options.privateKey);

    this.web3.eth.contractDataInputFill = "both";
  }
  /* eslint-enable complexity */

  async sendNativeToken(to: string, amount: number) {
    const data = {
      from: await this.getAddress(), to,
      value: this.utils?.toWei(amount, "ether")
    };

    return this.eth?.sendTransaction(data)
  }

}