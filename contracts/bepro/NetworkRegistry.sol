pragma solidity >=0.6.0 <=8.0.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

import "./INetworkV2.sol";
import "../utils/Governed.sol";
import "./BountyToken.sol";

contract NetworkRegistry is Governed {

    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 constant MAX_PERCENT = 100000000;
    uint256 public DIVISOR = 1000000; // used so client can understand and send correct conversions
    uint256 public MAX_LOCK_PERCENTAGE_FEE = 10000000; // used so client can understand and send correct conversions

    // Record of all networks used by this registry for history sake
    INetworkV2[] public networksArray;
    IERC20 public erc20;
    BountyToken public bountyToken;

    EnumerableSet.AddressSet private _transactionalTokens;
    EnumerableSet.AddressSet private _rewardTokens;

    address public treasury = address(0);

    uint256 public lockAmountForNetworkCreation = 1000000 * 10 ** 18; // 1M
    uint256 public totalLockedAmount = 0;
    uint256 public lockFeePercentage = 1000000; // 1%
    uint256 public closeFeePercentage = 5000000; // 5%
    uint256 public cancelFeePercentage = 5000000; // 5%

    mapping(address => uint256) public lockedTokensOfAddress;
    mapping(address => address) public networkOfAddress;
    mapping(address => bool) public openNetworks;

    event NetworkRegistered(address network, address indexed creator, uint256 id);
    event NetworkClosed(address indexed network);
    event UserLockedAmountChanged(address indexed user, uint256 indexed newAmount);
    event ChangedFee(uint256 indexed closeFee, uint256 indexed cancelFee);
    event ChangeAllowedTokens(address[] indexed tokens, string operation, string kind);

    function _closeAndCancelFeesLimits(uint256 _cancelFee, uint256 _closeFee) internal {
        require(_cancelFee <= MAX_PERCENT, "CGF1");
        require(_closeFee <= MAX_PERCENT, "CGF1");
    }

    function _lockPercentageLimits(uint256 newAmount) internal view {
        require(newAmount <= MAX_LOCK_PERCENTAGE_FEE, "CLF1");
    }

    constructor(IERC20 _erc20,
        uint256 _lockAmountForNetworkCreation,
        address _treasury,
        uint256 _lockFeePercentage,
        uint256 _closeFeePercentage,
        uint256 _cancelFeePercentage,
        address _bountyToken) Governed() {

        _closeAndCancelFeesLimits(_cancelFeePercentage, _closeFeePercentage);
        _lockPercentageLimits(_lockFeePercentage);

        erc20 = IERC20(_erc20);
        lockAmountForNetworkCreation = _lockAmountForNetworkCreation;
        treasury = _treasury;
        lockFeePercentage = _lockFeePercentage;
        closeFeePercentage = _closeFeePercentage;
        cancelFeePercentage = _cancelFeePercentage;
        bountyToken = BountyToken(_bountyToken);
    }

    function isAllowedToken(address tokenAddress, bool transactional) external view returns (bool) {
        return (transactional ? _transactionalTokens : _rewardTokens).contains(tokenAddress);
    }

    function amountOfNetworks() external view returns (uint256) {
        return networksArray.length;
    }

    /*
     * Lock an amount into the smart contract to be used to register a network
     */
    function lock(uint256 _amount) external {
        require(_amount > 0, "L0");

        lockedTokensOfAddress[msg.sender] = lockedTokensOfAddress[msg.sender].add(_amount);
        totalLockedAmount = totalLockedAmount.add(_amount);

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);

        require(erc20.transferFrom(msg.sender, address(this), _amount), "L1");
    }

    /*
     * Unlock all tokens and close the network if one exists and can be closed, otherwise don't allow unlocking
     */
    function unlock() external {
        require(lockedTokensOfAddress[msg.sender] > 0, "UL0");

        if (networkOfAddress[msg.sender] != address(0)) {
            INetworkV2 network = INetworkV2(networkOfAddress[msg.sender]);
            require(network.totalNetworkToken() == 0, "UL1");
            require((network.closedBounties() + network.canceledBounties()) == network.bountiesIndex(), "UL2");

            openNetworks[networkOfAddress[msg.sender]] = false;
            networkOfAddress[msg.sender] = address(0);

            emit NetworkClosed(networkOfAddress[msg.sender]);
        }

        totalLockedAmount = totalLockedAmount.sub(lockedTokensOfAddress[msg.sender]);
        lockedTokensOfAddress[msg.sender] = 0;

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);

        require(erc20.transfer(msg.sender, lockedTokensOfAddress[msg.sender]), "UL3");
    }

    /*
     * Register a new network on the contract, if a treasury exists then subtract and transfer the amount
     * of {@lockFeePercentage} to the treasury and update both the totalLockedAmount as the amount of locked
     * tokens of the sender
     */
    function registerNetwork(address networkAddress) external {
        INetworkV2 network = INetworkV2(networkAddress);
        uint256 fee = (lockAmountForNetworkCreation.mul(lockFeePercentage)).div(MAX_PERCENT);

        require(networkOfAddress[msg.sender] == address(0), "R0");
        require(lockedTokensOfAddress[msg.sender] >= lockAmountForNetworkCreation, "R1");
        require(network._governor() == msg.sender, "R2");
        require(address(network.registry()) == address(this), "R4");

        if (treasury != address(0)) {
            require(erc20.transfer(treasury, fee), "R3");
            totalLockedAmount = totalLockedAmount.sub(fee);
        }

        networksArray.push(network);

        openNetworks[networkAddress] = true;
        networkOfAddress[msg.sender] = networkAddress;
        lockedTokensOfAddress[msg.sender] = lockedTokensOfAddress[msg.sender].sub(fee);
        emit NetworkRegistered(networkAddress, msg.sender, networksArray.length - 1);
    }

    function changeAmountForNetworkCreation(uint256 newAmount) external onlyGovernor {
        lockAmountForNetworkCreation = newAmount;
    }

    function changeLockPercentageFee(uint256 newAmount) external onlyGovernor {
        _lockPercentageLimits(newAmount);
        lockFeePercentage = newAmount;
    }

    /*
     * Change global fees related to registered networks
     * 1% = 10,000
     */
    function changeGlobalFees(uint256 _closeFee, uint256 _cancelFee) external onlyGovernor {
        _closeAndCancelFeesLimits(_cancelFee, _closeFee);
        closeFeePercentage = _closeFee;
        cancelFeePercentage = _cancelFee;
        emit ChangedFee(closeFeePercentage, cancelFeePercentage);
    }

    function addAllowedTokens(address[] calldata _erc20Addresses, bool transactional) onlyGovernor external {
        EnumerableSet.AddressSet storage pointer = transactional ? _transactionalTokens : _rewardTokens;
        uint256 len = _erc20Addresses.length;

        for (uint256 z = 0; z < len; z++) {
            require(pointer.add(_erc20Addresses[z]) == true, "AT1");
        }

        emit ChangeAllowedTokens(_erc20Addresses, "remove", transactional ? "transactional" : "reward");
    }

    function removeAllowedTokens(address[] calldata _erc20Addresses, bool transactional) onlyGovernor external {
        EnumerableSet.AddressSet storage pointer = transactional ? _transactionalTokens : _rewardTokens;
        uint256 len = _erc20Addresses.length;
        for (uint256 z = 0; z < len; z++) {
            require(pointer.remove(_erc20Addresses[z]) == true, "RT1");
        }

        emit ChangeAllowedTokens(_erc20Addresses, "remove", transactional ? "transactional" : "reward");
    }

    function getAllowedTokens() public view returns (bytes32[] memory transactional, bytes32[] memory reward) {
        transactional = _transactionalTokens._inner._values;
        reward = _transactionalTokens._inner._values;
    }

    function getAllowedToken(uint256 x, bool transactional) external view returns (address) {
        return (transactional ? _transactionalTokens : _rewardTokens).at(x);
    }

    function getAllowedTokenLen(bool transactional) external view returns (uint256) {
        return (transactional ? _transactionalTokens : _rewardTokens).length();
    }

    function awardBounty(address to, string memory uri, INetworkV2.BountyConnector calldata award) external {
        require(openNetworks[msg.sender] == true, "A0");
        require(address(bountyToken) != address(0), "A1");
        bountyToken.awardBounty(to, uri, award);
    }

}
