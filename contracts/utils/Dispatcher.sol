pragma solidity >=0.6.0;
pragma abicoder v2;

contract Dispatcher {

    address public dispatcher = address(0);

    event DispatcherChanged(address indexed oldValue, address indexed newValue);

    modifier onlyDispatcher() {
        require(msg.sender == dispatcher);
        _;
    }

    function _setDispatcher(address newDispatcher) internal virtual {
        require(dispatcher != newDispatcher, "Same dispatcher");

        emit DispatcherChanged(dispatcher, newDispatcher);

        dispatcher = newDispatcher;
    }
}
