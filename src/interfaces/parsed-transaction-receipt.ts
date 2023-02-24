import {Log, TransactionReceipt} from "@interfaces/web3-core";

export type ParsedTransactionReceipt<T = any> = TransactionReceipt & {logs: Array<(Log & {event: string, args: T})>}