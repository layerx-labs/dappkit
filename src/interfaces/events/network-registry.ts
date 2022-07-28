export interface GovernorTransferredEvent { returnValues: {'previousGovernor':  string;'newGovernor':  string;} }
export interface NetworkClosedEvent { returnValues: { 'network':  string; } }
export interface NetworkRegisteredEvent { returnValues: {'network':  string;'creator':  string;'id':  number;} }
export interface UserLockedAmountChangedEvent { returnValues: {'user':  string;'newAmount':  number;} }