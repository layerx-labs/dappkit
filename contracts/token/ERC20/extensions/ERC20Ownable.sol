// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Ownable is ERC20, Ownable {
    uint8 private _decimals;

    constructor(string memory _name, string memory _symbol, uint8 decimals_, uint256 initialSupply) public Ownable(_msgSender()) ERC20(_name, _symbol) {
        if (initialSupply > 0) {
            _mint(_msgSender(), initialSupply);
        }

        _decimals = decimals_;
    }

    function mint(address receiver, uint256 amount) public onlyOwner {
        _mint(receiver, amount);
    }
}