import { Delegation } from "./delegation";

export interface OraclesResume {
    locked: string | number;
    delegatedToOthers: string | number;
    delegatedByOthers: string | number;
    delegations: Delegation[];
}