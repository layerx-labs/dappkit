export interface ApprovalForAllEvent {
  returnValues: { account: string; operator: string; approved: boolean };
}
export interface OwnershipTransferredEvent {
  returnValues: { previousOwner: string; newOwner: string };
}
export interface TransferBatchEvent {
  returnValues: {
    operator: string;
    from: string;
    to: string;
    ids: number[];
    values: number[];
  };
}
export interface TransferSingleEvent {
  returnValues: {
    operator: string;
    from: string;
    to: string;
    id: number;
    value: number;
  };
}
export interface URIEvent {
  returnValues: { value: string; id: number };
}
