pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import ".\ERC20Standard.sol";
import "..\..\utils\Ownable.sol";

contract ERC20CappedOwnable is ERC20Standard, ERC20Capped, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 memory cap_,
        address distributionAddress) public ERC20Standard(name_, symbol_) ERC20Capped(cap_) Ownable() {
        _mint(distributionAddress, totalAmount);
    }
}
