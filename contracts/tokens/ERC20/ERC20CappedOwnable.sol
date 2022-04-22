pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../utils/Ownable.sol";

contract ERC20CappedOwnable is ERC20Capped, Ownable {
    string private _name;
    string private _symbol;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 cap_,
        address distributionAddress) public ERC20(name_, symbol_) ERC20Capped(cap_) Ownable() {
//        _name = name_;
//        _symbol = symbol_;
        _mint(distributionAddress, cap_);
    }
}
