export enum Errors {
  NoPrivateKeyFoundOnOptions = `No private key found on options`,
  ProviderOptionsAreMandatoryIfIPC = `Provider options are mandatory if chosen provider is IPC`,
  NoEthereumObjectFoundOnWindow = `No ethereum object found on window`,
  WindowObjectNotFound = `Window object not found`,
  MissingWeb3ProviderHost = `Missing options.web3Host parameter`,
  MissingAbiInterfaceFromArguments = `Missing ABI Interface from arguments list or empty Abi`,
  AmountNeedsToBeHigherThanZero = `Amount needs to be higher than zero`,
  MissingContractAddress = `Missing contract address`,
  ContractIsPaused = `Contract is paused`,
  MissingTokenAddress = `Missing token address`,
  OnlyAdminCanPerformThisOperation = `Only admin can perform this operation`,
  InvalidTokenAmount = `Invalid token amount`,
  InteractionIsNotAvailableCallApprove = `Interaction not available, call 'approve' first`,
  NoLockedAmountOrNotReleaseDate = `User has no locked amount or release date has not been reached`,
  MissingERC20AddressOnContractPleaseSetPurchaseToken =
    `Missing ERC20 address on contract, please call setPurchaseTokenAddress`,
  MissingLpTokenAddressPleaseDeployUsingOne = `Missing lp token address please deploy Loophole class using one`,
  MissingSwapAddressPleaseDeployUsingOne = `Missing swap router address, please deploy using one`,
  MissingEthUtilsAddressPleaseProvideOne = `Missing eth utils address, please provide one`,
  GasAndGasPriceMustBeProvidedIfNoAutoTxOptions = `Both gas and gasPrice must be provided if no auto txOptions`,
  MissingERC20UnderlyingToken = `Missing ERC20 underlying token address`,
}