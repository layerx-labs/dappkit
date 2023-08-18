import {type EventLog} from "web3-eth-contract/lib/commonjs/types";

type CustomReturnValues<T = unknown> = {
  readonly returnValues: Record<string, unknown> & T
}

export type CustomEvent<T = unknown> = (string | EventLog & CustomReturnValues<T>)