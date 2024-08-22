export type GovernorTransferredEvent = CustomEvent<{previousGovernor:  string;newGovernor:  string;}>
export interface NetworkClosedEvent { returnValues: { 'network':  string; } }
export interface NetworkRegisteredEvent { returnValues: {'network':  string;'creator':  string;'id':  number;} }
export interface UserLockedAmountChangedEvent { returnValues: {'user':  string;'newAmount':  number;} }
export interface ChangedFeeEvent { returnValues: {'closeFee':  number;'cancelFee':  number;} }
export interface ChangeAllowedTokensEvent { returnValues: {'tokens':  string;'operation':  string;'kind': string} }
export interface LockFeeChangedEvent { returnValues: {'lockFee':  number;} }