import { Delegation } from "@interfaces/bepro/delegation";
import { Oracle } from "@interfaces/bepro/oracle";
import { OraclesResume } from "@interfaces/bepro/oracles-resume";

import { fromSmartContractDecimals } from "@utils/numbers";

export function oraclesResume(oracles: Oracle, 
                              delegations: Delegation[], 
                              settlerTokenDecimals = 18): OraclesResume {
  return {
    locked: fromSmartContractDecimals(oracles.locked, settlerTokenDecimals),
    delegatedToOthers: fromSmartContractDecimals(oracles.toOthers, settlerTokenDecimals),
    delegatedByOthers: fromSmartContractDecimals(oracles.byOthers, settlerTokenDecimals),
    delegations
  };
}