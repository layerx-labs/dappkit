export interface ApprovalEvent { returnValues: {'owner': string;'spender': string;'value': number;} }
export interface DepositEvent { returnValues: {'sender': string;'owner': string;'assets': number;'shares': number;} }
export interface TransferEvent { returnValues: {'from': string;'to': string;'value': number;} }
export interface WithdrawEvent { returnValues: {'sender': string;'receiver': string;'owner': string;'assets': number;'shares': number;} }