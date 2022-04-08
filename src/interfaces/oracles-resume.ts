import { Delegation } from "./delegation";

export interface OraclesResume {
    locked: number;
    delegatedToOthers: number;
    delegatedByOthers: number;
    delegations: Delegation[];
}