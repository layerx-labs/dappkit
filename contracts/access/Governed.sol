pragma solidity >=0.8.0;


/**
 * @title Governed
 * @dev The Governable contract has an governor smart contract address, and provides basic authorization control
 * functions, this simplifies the implementation of "gov permissions".
 */
contract Governed {
    address public _proposedGovernor;
    address public _governor;
    event GovernorTransferred(address indexed previousGovernor, address indexed newGovernor);


    /**
    * @dev The Ownable constructor sets the original `governor` of the contract to the sender
    * account.
    */
    constructor() {
        _governor = msg.sender;
    }

    function _onlyGovernor() internal view {
        require(msg.sender == _governor);
    }
    
    /**
    * @dev Throws if called by any account other than the governor.
    */
    modifier onlyGovernor() {
        _onlyGovernor();
        _;
    }

    function proposeGovernor(address proposedGovernor) public payable onlyGovernor {
        require(msg.sender != proposedGovernor);
        _proposedGovernor = proposedGovernor;
    }

    function claimGovernor() public payable {
        require(msg.sender == _proposedGovernor);
        emit GovernorTransferred(_governor, _proposedGovernor);
        _governor = _proposedGovernor;
        _proposedGovernor = address(0);
    }

}
