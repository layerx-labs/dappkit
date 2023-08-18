import {Ownable} from '@base/ownable';
import {ETHUtils} from '@models/eth-utils';

export abstract class IsOwnable {
  abstract readonly ownable: Ownable;
}

export abstract class HasEthUtils {
  abstract readonly ethUtils: ETHUtils
}
