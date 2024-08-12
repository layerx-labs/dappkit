export enum Errors {
  NoEthereumObjectFoundOnWindow = `No ethereum object found on window`,
  WindowObjectNotFound = `Window object not found`,
  MissingWeb3ProviderHost = `Missing options.web3Host parameter and options.web3CustomProvider; Either is required.`,
  MissingAbiInterfaceFromArguments = `Missing ABI Interface from arguments list or empty Abi`,
  MissingContractAddress = `Missing contract address`,
  MissingTokenAddress = `Missing token address`,
  OnlyAdminCanPerformThisOperation = `Only admin can perform this operation`,
  InvalidTokenAmount = `Invalid token amount`,
  InteractionIsNotAvailableCallApprove = `Interaction not available, call 'approve' first`,
  GasAndGasPriceMustBeProvidedIfNoAutoTxOptions = `Both gas and gasPrice must be provided if no auto txOptions`,
  FailedToAssignAProvider = `Failed to assign a provider. Doublecheck Web3ConnectionOptions.`
}
