import {EventData} from 'web3-eth-contract';
import {PromiEvent} from "web3-core";

export type XEvents<V> = { [K in keyof EventData]: EventData[K] extends V ? V : any }
export type XPromiseEvent<V> = Promise<XEvents<V>[]>
export type XPromiEvent<V> = PromiEvent<XEvents<V>>
