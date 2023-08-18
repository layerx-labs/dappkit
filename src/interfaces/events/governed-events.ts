import {CustomEvent} from "@events/x-events";

export type GovernorTransferredEvent = CustomEvent<{returnValues: {'previousGovernor': string;'newGovernor': string;}}>
