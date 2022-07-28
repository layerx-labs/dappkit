pragma solidity >=0.6.0 <=8.0.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

import "../utils/ReentrancyGuardOptimized.sol";
import "./INetwork_v2.sol";
import "../utils/Governed.sol";
import "../math/SafePercentMath.sol";
import "./BountyToken.sol";

contract Network_Registry is ReentrancyGuardOptimized, Governed {

    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    INetwork_v2[] public networksArray;
    IERC20 public erc20;
    BountyToken public bountyToken;

    EnumerableSet.AddressSet private _transactionalTokens;
    EnumerableSet.AddressSet private _rewardTokens;

    address public treasury = address(0);

    uint256 public lockAmountForNetworkCreation = 1000000 * 10 ** 18; // 1M
    uint256 public totalLockedAmount = 0;
    uint256 public lockFeePercentage = 10000; // 1%; parts per 10,000
    uint256 public closeFeePercentage = 0;
    uint256 public cancelFeePercentage = 0;

    mapping(address => uint256) public lockedTokensOfAddress;
    mapping(address => address) public networkOfAddress;
    mapping(address => bool) public openNetworks;

    event NetworkRegistered(address network, address indexed creator, uint256 id);
    event NetworkClosed(address indexed network);
    event UserLockedAmountChanged(address indexed user, uint256 indexed newAmount);
    event ChangedFee(uint256 indexed closeFee, uint256 indexed cancelFee);
    event ChangeAllowedTokens(address[] indexed tokens, string operation, string kind);

    constructor(IERC20 _erc20,
        uint256 _lockAmountForNetworkCreation,
        address _treasury,
        uint256 _lockFeePercentage,
        uint256 _closeFeePercentage,
        uint256 _cancelFeePercentage,
        address _bountyToken) ReentrancyGuardOptimized() Governed() {
        erc20 = IERC20(_erc20);
        lockAmountForNetworkCreation = _lockAmountForNetworkCreation;
        treasury = _treasury;
        lockFeePercentage = _lockFeePercentage;
        closeFeePercentage = _closeFeePercentage;
        cancelFeePercentage = _cancelFeePercentage;
        bountyToken = BountyToken(_bountyToken);
    }

    function isAllowedToken(address tokenAddress, bool transactional) public view returns (bool) {
        return (transactional ? _transactionalTokens : _rewardTokens).contains(tokenAddress);
    }

    function amountOfNetworks() public view returns (uint256) {
        return networksArray.length;
    }

    /*
     * Lock an amount into the smart contract to be used to register a network
     */
    function lock(uint256 _amount) public {
        require(_amount > 0, "L0");
        require(erc20.transferFrom(msg.sender, address(this), _amount), "L1");

        lockedTokensOfAddress[msg.sender] = lockedTokensOfAddress[msg.sender].add(_amount);
        totalLockedAmount = totalLockedAmount.add(_amount);

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);
    }

    /*
     * Unlock all tokens and close the network if one exists and can be closed, otherwise don't allow unlocking
     */
    function unlock() public {
        require(lockedTokensOfAddress[msg.sender] > 0, "UL0");

        if (networkOfAddress[msg.sender] != address(0)) {
            INetwork_v2 network = INetwork_v2(networkOfAddress[msg.sender]);
            require(network.totalNetworkToken() == 0, "UL1");
            require((network.closedBounties() + network.canceledBounties()) == network.bountiesIndex(), "UL2");

            openNetworks[networkOfAddress[msg.sender]] = false;
            networkOfAddress[msg.sender] = address(0);

            emit NetworkClosed(networkOfAddress[msg.sender]);
        }

        require(erc20.transfer(msg.sender, lockedTokensOfAddress[msg.sender]), "UL3");

        totalLockedAmount = totalLockedAmount.sub(lockedTokensOfAddress[msg.sender]);
        lockedTokensOfAddress[msg.sender] = 0;

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);
    }

    /*
     * Register a new network on the contract, if a treasury exists then subtract and transfer the amount
     * of {@lockFeePercentage} to the treasury and update both the totalLockedAmount as the amount of locked
     * tokens of the sender
     */
    function registerNetwork(address networkAddress) public {
        INetwork_v2 network = INetwork_v2(networkAddress);
        uint256 fee = lockAmountForNetworkCreation.div(100).mul(lockFeePercentage.div(10000));

        require(networkOfAddress[msg.sender] == address(0), "R0");
        require(lockedTokensOfAddress[msg.sender] >= lockAmountForNetworkCreation, "R1");
        require(network._governor() == msg.sender, "R2");

        if (treasury != address(0)) {
            require(erc20.transfer(treasury, fee), "R3");
            totalLockedAmount = totalLockedAmount.sub(fee);
        }

        require(address(network.registry()) == address(this), "R4");

        networksArray.push(network);
        openNetworks[networkAddress] = true;
        networkOfAddress[msg.sender] = networkAddress;
        lockedTokensOfAddress[msg.sender] = lockedTokensOfAddress[msg.sender].sub(fee);
        emit NetworkRegistered(networkAddress, msg.sender, networksArray.length - 1);
    }

    function changeAmountForNetworkCreation(uint256 newAmount) public onlyGovernor {
        require(newAmount > 0, "C1");
        lockAmountForNetworkCreation = newAmount;
    }

    function changeLockPercentageFee(uint256 newAmount) public onlyGovernor {
        require(newAmount.div(10000) <= 10, "CLF1");
        lockFeePercentage = newAmount;
    }

    function changeGlobalFees(uint256 _closeFee, uint256 _cancelFee) public onlyGovernor {
        require(_cancelFee >= 0, "CGF1");
        require(_closeFee >= 0, "CGF1");
        closeFeePercentage = _closeFee;
        cancelFeePercentage = _cancelFee;
        emit ChangedFee(closeFeePercentage, cancelFeePercentage);
    }

    function addAllowedTokens(address[] calldata _erc20, bool transactional) external {
        EnumerableSet.AddressSet storage pointer = transactional ? _transactionalTokens : _rewardTokens;
        uint256 len = _erc20.length;

        for (uint256 z = 0; z < len; z++) {
            require(pointer.add(_erc20[z]) == true, "AT1");
        }
    }

    function removeAllowedTokens(address[] calldata _erc20, bool transactional) external {
        EnumerableSet.AddressSet storage pointer = transactional ? _transactionalTokens : _rewardTokens;
        uint256 len = _ids.length;
        for (uint256 z = 0; z < len; z++) {
            require(pointer.remove(_ids[z]) == true, "RT1");
        }
    }

    function getAllowedTokens() public view returns (address[] memory transactional, address[] memory reward) {
        uint256 tLen = _transactionalTokens.length();
        uint256 rLen = _rewardTokens.length();
        transactional = new address[](tLen);
        reward = new address[](rLen);

        for (uint256 z = 0; z < tLen; z++) {
            transactional[z] = _transactionalTokens.at(z);
        }

        for (uint256 z = 0; z < rLen; z++) {
            reward[z] = _rewardTokens.at(z);
        }
    }

    function awardBounty(address to, string memory uri, INetwork_v2.BountyConnector calldata award) public {
        require(openNetworks[msg.sender] == true, "A0");
        bountyToken.awardBounty(to, uri, award);
    }

}
