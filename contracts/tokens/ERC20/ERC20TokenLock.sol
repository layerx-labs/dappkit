pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../utils/Ownable.sol";

contract ERC20TokenLock is Pausable, Ownable {
    using SafeMath for uint256;

    struct lockedTokensInfo {
        uint256 startDate; //block.timestamp
        uint256 endDate;
        uint256 amount;
    }

    IERC20 public erc20;
    uint256 public maxAmountToLock = 0;
    uint256 public minAmountToLock = 0;
    uint256 public totalAmountStaked = 0;

    mapping(address => lockedTokensInfo) lockedTokensMap;

    event MaxAmountToLockChanged(address owner, uint256 oldValue, uint256 newValue);
    event MinAmountToLockChanged(address owner, uint256 oldValue, uint256 newValue);
    event TokensLocked(address user, lockedTokensInfo info);
    event TokensReleased(address user, uint256 amount, uint256 withdrawDate);

    function setMaxAmountToLock(uint256 newAmount) external onlyOwner {
        require(newAmount != maxAmountToLock, "MAX1");
        require(newAmount >= minAmountToLock, "MAX2");

        uint256 oldValue = maxAmountToLock;
        maxAmountToLock = newAmount;

        emit MaxAmountToLockChanged(msg.sender, oldValue, newAmount);
    }

    function setMinAmountToLock(uint256 newAmount) external onlyOwner {
        require(newAmount != minAmountToLock, "MAX1");
        require(newAmount <= maxAmountToLock, "MAX2");

        uint256 oldValue = minAmountToLock;
        minAmountToLock = newAmount;

        emit MinAmountToLockChanged(msg.sender, oldValue, newAmount);
    }

    function lock(uint256 amount, uint256 endDate) {
        require(amount > 0 && amount >= minAmountToLock, "L1");
        require(endDate > block.timestamp, "L2");
        require(lockedTokensMap[msg.sender].amount == 0, "L3");
        require(erc20.transferFrom(msg.sender, address(this), amount), "L4");

        lockedTokensMap[msg.sender] = lockedTokensInfo(block.timestamp, endDate, amount);
        totalAmountStaked = totalAmountStaked.add(amount);

        emit TokensLocked(msg.sender, lockedTokensMap[msg.sender]);
    }

    function release() external {
        lockedTokensInfo storage locked = lockedTokensMap[msg.sender];
        require(locked.amount > 0, "R1");
        require(locked.endDate <= block.timestamp, "R2");
        require(erc20.transfer(msg.sender, locked.amount), "R3");

        emit TokensReleased(msg.sender, locked.amount);

        totalAmountStaked = totalAmountStaked.sub(locked.amount);
        locked.amount = 0;
    }

    function canRelease(address user) external view returns (bool) {
        return block.timestamp >= lockedTokensMap[user].endDate;
    }

    function getLockedTokens(address user) external view returns (uint256) {
        return lockedTokensMap[user].amount;
    }

    function getLockedTokensInfo(address user) external view returns (lockedTokensInfo memory info) {
        return lockedTokensMap[user];
    }

    constructor(address tokenAddress_, uint256 maxAmountToLock_, uint256 minAmountToLock_) Ownable() Pausable() public {
        erc20 = IERC20(tokenAddress_);
        maxAmountToLock = maxAmountToLock_;
        minAmountToLock = minAmountToLock_;
    }
}
