import { Delegation } from "@interfaces/delegation";
import { Oracle } from "@interfaces/oracle";
import { OraclesResume } from "@interfaces/oracles-resume";

import { fromSmartContractDecimals } from "@utils/numbers";

export function oraclesResume(oracles: Oracle, 
                              delegations: Delegation[], 
                              settlerTokenDecimals = 18): OraclesResume {
  return {
    locked: fromSmartContractDecimals(+oracles.locked, settlerTokenDecimals),
    delegatedToOthers: fromSmartContractDecimals(+oracles.toOthers, settlerTokenDecimals),
    delegatedByOthers: fromSmartContractDecimals(+oracles.byOthers, settlerTokenDecimals),
    delegations
  };
}