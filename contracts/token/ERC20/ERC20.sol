pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../utils/Ownable.sol";

// File: openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol

/**
 * @title Capped token
 * @dev Mintable token with a token cap.
 */
contract CappedToken is ERC20, Ownable{

    address public distributionContract;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cap, address _distributionContract) public ERC20(_name, _symbol) {
        _mint(_distributionContract, _cap);
    }

}

contract OwnableERC20 is ERC20, Ownable {
    uint8 private _decimals;

    constructor(string memory _name, string memory _symbol, uint8 decimals_, uint256 initialSupply) Ownable() ERC20(_name, _symbol) {
        if (initialSupply > 0) {
            _mint(_msgSender(), initialSupply);
        }

        _decimals = decimals_;
    }

    function mint(address receiver, uint256 amount) public onlyOwner {
        _mint(receiver, amount);
    }
}

contract Token is OwnableERC20 {

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cap,
        address _distributionContract) public OwnableERC20(_name, _symbol, 18, _cap) {
    }
}
