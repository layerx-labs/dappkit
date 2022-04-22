pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../utils/Ownable.sol";

contract ERC20Distribution is Pausable, Ownable {
    using SafeMath for uint256;

    IERC20 public erc20;

    // @dev Tracks distributions mapping (iterable)
    address[] public tokenOwners;

    // @dev Date from where the distribution starts (TGE)
    uint256 public TGEDate = 0;
    uint256 public lastDistribution = 0;

    uint256 constant public decimals = 1 ether;
    uint256 constant public month = 30 days;
    uint256 constant public year = 365 days;

    struct DistributionStep {
        uint256 amountAllocated;
        uint256 currentAllocated;
        uint256 unlockDay;
        uint256 amountSent;
    }

    mapping(address => DistributionStep[]) public distributions;

    function setTokenAddress(IERC20 tokenAddress_) external onlyOwner whenNotPaused {
        require(tokenAddress_ != erc20, "STA1");
        erc20 = tokenAddress_;
    }

    function safeGuardAllTokens(address address_) external onlyOwner whenNotPaused {
        require(erc20.transfer(address_, erc20.balanceOf(address(this))));
    }

    function setTGEDate(uint256 time_) public onlyOwner whenNotPaused {
        TGEDate = time_;
    }

    function triggerTokenSend() external whenNotPaused {
        require(TGEDate != 0, "TTS1");
        require(block.timestamp > TGEDate, "TTS2");
        require(block.timestamp.sub(lastDistribution) > 1 days, "TTS3");

        for (uint256 i = 0; i < tokenOwners.length; i++) {
            DistributionStep[] storage distribution = distributions[tokenOwners[i]];
            for (uint256 z = 0; z < distribution.length; z++) {
                DistributionStep storage step = distribution[z];
                if (block.timestamp.sub(TGEDate) > step.unlockDay && step.currentAllocated > 0) {
                    require(erc20.transfer(tokenOwners[i], step.currentAllocated), "TTS4");
                    step.currentAllocated = step.currentAllocated.sub(step.currentAllocated);
                    step.amountSent = step.amountSent.add(step.currentAllocated);
                }
            }
        }
    }

    function setInitialDistribution(address address_, uint256 tokenAmount_, uint256 unlockDay_) external onlyOwner whenNotPaused {
        if (distributions[address_].length == 0) {
            tokenOwners.push(address_);
        }

        distributions[address_]
            .push(DistributionStep(tokenAmount_.mul(decimals), tokenAmount_.mul(decimals), unlockDay_, 0));
    }

    constructor(IERC20 tokenAddress_, uint256 time_) public {
        erc20 = tokenAddress_;
        TGEDate = time_;
    }
}
