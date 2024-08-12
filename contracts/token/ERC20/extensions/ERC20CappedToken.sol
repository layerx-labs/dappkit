// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20CappedToken is ERC20, Ownable {

    address public distributionContract;
    uint256 public supplyCap;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _supplyCap,
        address _distributionContract
    ) public ERC20(_name, _symbol) Ownable(_msgSender()) {
        supplyCap = _supplyCap;
        _mint(_distributionContract, _supplyCap);
    }

    function mint(address receiver, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= supplyCap, "ERC20CappedToken: supply overflow");
        _mint(receiver, amount);
    }
}
