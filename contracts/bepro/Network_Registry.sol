pragma solidity >=0.6.0 <=8.0.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../utils/ReentrancyGuardOptimized.sol";
import "./INetwork_v2.sol";
import "../utils/Governed.sol";

contract Network_Registry is ReentrancyGuardOptimized, Governed {
    constructor(IERC20 _erc20, uint256 _lockAmountForNetworkCreation) ReentrancyGuardOptimized() Governed() {
        erc20 = IERC20(_erc20);
        lockAmountForNetworkCreation = _lockAmountForNetworkCreation;
    }

    using SafeMath for uint256;

    INetwork_v2[] public networksArray;
    IERC20 public erc20;

    uint256 public lockAmountForNetworkCreation = 1000000 * 10 ** 18;
    uint256 public totalLockedAmount = 0;

    mapping(address => uint256) public lockedTokensOfAddress;
    mapping(address => address) public networkOfAddress;

    event NetworkCreated(address network, address indexed creator, uint256 id);
    event NetworkClosed(address indexed network);
    event UserLockedAmountChanged(address indexed user, uint256 indexed newAmount);

    function amountOfNetworks() external view returns (uint256) {
        return networksArray.length;
    }

    function lock(uint256 _amount) external payable {
        require(_amount > 0, "L0");
        require(erc20.transferFrom(msg.sender, address(this), _amount), "L1");

        lockedTokensOfAddress[msg.sender] = lockedTokensOfAddress[msg.sender].add(_amount);
        totalLockedAmount = totalLockedAmount.add(_amount);

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);
    }

    function unlock() external payable {
        require(lockedTokensOfAddress[msg.sender] > 0, "UL0");
        if (networkOfAddress[msg.sender] != address(0)) {
            INetwork_v2 network = INetwork_v2(networkOfAddress[msg.sender]);
            require(network.totalSettlerLocked() == 0, "UL1");
            require((network.closedBounties() + network.canceledBounties()) == network.bountiesIndex(), "UL2");
            networkOfAddress[msg.sender] = address(0);
            emit NetworkClosed(networkOfAddress[msg.sender]);
        }

        require(erc20.transfer(msg.sender, lockedTokensOfAddress[msg.sender]), "UL3");

        totalLockedAmount = totalLockedAmount.sub(lockedTokensOfAddress[msg.sender]);
        lockedTokensOfAddress[msg.sender] = 0;

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);
    }

    function registerNetwork(address networkAddress) external payable {
        INetwork_v2 network = INetwork_v2(networkAddress);
        require(network._governor() == msg.sender, "R1");
        networksArray.push(network);
        networkOfAddress[msg.sender] = networkAddress;
        emit NetworkCreated(networkAddress, msg.sender, networksArray.length - 1);
    }

    function changeAmountForNetworkCreation(uint256 newAmount) external payable onlyGovernor {
        require(newAmount > 0, "C1");
        lockAmountForNetworkCreation = newAmount * 10 ** 18;
    }

}
