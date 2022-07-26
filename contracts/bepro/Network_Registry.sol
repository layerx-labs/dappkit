pragma solidity >=0.6.0 <=8.0.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../utils/ReentrancyGuardOptimized.sol";
import "./INetwork_v2.sol";
import "../utils/Governed.sol";
import "../math/SafePercentMath.sol";
import "./BountyToken.sol";

contract Network_Registry is ReentrancyGuardOptimized, Governed {

    constructor(IERC20 _erc20,
        uint256 _lockAmountForNetworkCreation,
        address _treasury,
        uint256 _lockFeePercentage,
        uint256 _closeFee,
        uint256 _cancelFee,
        address _bountyToken) ReentrancyGuardOptimized() Governed() {
        erc20 = IERC20(_erc20);
        lockAmountForNetworkCreation = _lockAmountForNetworkCreation;
        treasury = _treasury;
        lockFeePercentage = _lockFeePercentage;
        closeFee = _closeFee;
        cancelFee = _cancelFee;
        bountyToken = BountyToken(_bountyToken);
    }

    using SafeMath for uint256;

    INetwork_v2[] public networksArray;
    IERC20 public erc20;
    BountyToken public bountyToken;


    struct AllowedToken {
        address _address;
        uint256 id;
    }

    mapping(address => address) public allowedTransactionalTokens;
    mapping(address => address) public allowedRewardTokens;
    address[] public _allowedTransactionalTokens;
    address[] public _allowedRewardTokens;

    address public treasury = address(0);

    uint256 public closeFee = 0;
    uint256 public cancelFee = 0;

    uint256 public lockAmountForNetworkCreation = 1000000 * 10 ** 18; // 1M
    uint256 public totalLockedAmount = 0;
    uint256 public lockFeePercentage = 10000; // 1%; parts per 10,000

    mapping(address => uint256) public lockedTokensOfAddress;
    mapping(address => address) public networkOfAddress;
    mapping(address => bool) public closedNetworks;

    event NetworkCreated(address network, address indexed creator, uint256 id);
    event NetworkClosed(address indexed network);
    event UserLockedAmountChanged(address indexed user, uint256 indexed newAmount);
    event ChangedFee(uint256 indexed closeFee, uint256 indexed cancelFee);
    event ChangeAllowedTokens(address[] indexed tokens, string operation, string kind);

    function amountOfNetworks() external view returns (uint256) {
        return networksArray.length;
    }

    function lock(uint256 _amount) public {
        require(_amount > 0, "L0");
        require(erc20.transferFrom(msg.sender, address(this), _amount), "L1");

        lockedTokensOfAddress[msg.sender] = lockedTokensOfAddress[msg.sender].add(_amount);
        totalLockedAmount = totalLockedAmount.add(_amount);

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);
    }

    function unlock() public {
        require(lockedTokensOfAddress[msg.sender] > 0, "UL0");

        if (networkOfAddress[msg.sender] != address(0)) {
            INetwork_v2 network = INetwork_v2(networkOfAddress[msg.sender]);
            require(network.totalNetworkToken() == 0, "UL1");
            require((network.closedBounties() + network.canceledBounties()) == network.bountiesIndex(), "UL2");
            closedNetworks[networkOfAddress[msg.sender]] = true;
            networkOfAddress[msg.sender] = address(0);

            emit NetworkClosed(networkOfAddress[msg.sender]);
        }

        require(erc20.transfer(msg.sender, lockedTokensOfAddress[msg.sender]), "UL3");

        totalLockedAmount = totalLockedAmount.sub(lockedTokensOfAddress[msg.sender]);
        lockedTokensOfAddress[msg.sender] = 0;

        emit UserLockedAmountChanged(msg.sender, lockedTokensOfAddress[msg.sender]);
    }

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
        networkOfAddress[msg.sender] = networkAddress;
        lockedTokensOfAddress[msg.sender] = lockedTokensOfAddress[msg.sender].sub(fee);
        emit NetworkCreated(networkAddress, msg.sender, networksArray.length - 1);
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
        closeFee = _closeFee;
        cancelFee = _cancelFee;
        emit ChangedFee(closeFee, cancelFee);
    }

    function addAllowedTokens(address[] calldata _erc20, bool transactional) public {
        mapping(address => address) storage pointer = transactional ? allowedTransactionalTokens : allowedRewardTokens;
        address[] storage array = transactional ? _allowedTransactionalTokens : _allowedRewardTokens;

        uint256 len = _erc20.length;

        for (uint256 z = 0; z < len; z++) {
            require(pointer[_erc20[z]] == address(0), "AT1");
            array.push(_erc20[z]);
            pointer[_erc20[z]] = _erc20[z];
        }

        emit ChangeAllowedTokens(_erc20, "add", transactional ? "transactional" : "reward");
    }

    function removeAllowedTokens(uint256[] calldata _ids, bool transactional) public {
        mapping(address => address) storage pointer = transactional ? allowedTransactionalTokens : allowedRewardTokens;
        address[] storage array = transactional ? _allowedTransactionalTokens : _allowedRewardTokens;
        address[] memory _erc20 = new address[](_ids.length);
        uint256 len = _ids.length;

        for (uint256 z = 0; z < len; z++) {
            address mapped = array[_ids[z]];
            require(pointer[mapped] != address(0), "RT1");
            _erc20[z] = mapped;
            pointer[mapped] = address(0);
            delete array[_ids[z]];
        }

        emit ChangeAllowedTokens(_erc20, "remove", transactional ? "transactional" : "reward");
    }

    function getAllowedTokens() public view returns (address[] memory transactional, address[] memory reward) {
        return (_allowedTransactionalTokens, _allowedRewardTokens);
    }

    function _networkExistsAndOpen(address _address) internal view returns (bool) {
        uint256 max = networksArray.length;
        bool found = false;
        uint256 z = 0;
        for (z; (z < max) && (found == false); z++) {
            found = address(networksArray[z]) == _address;
        }

        if (found == false)
          return false;

        return closedNetworks[address(networksArray[z-1])] == false;
    }

    function awardBounty(address to, string memory uri, INetwork_v2.BountyConnector calldata award) external {
        require(_networkExistsAndOpen(award.originNetwork), "A0");
        bountyToken.awardBounty(to, uri, award);
    }

}
