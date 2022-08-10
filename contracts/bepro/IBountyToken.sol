pragma abicoder v2;

import "./INetworkV2.sol";

interface IBountyToken {
    function tokenIds(uint256 i) external view returns (INetworkV2.BountyConnector memory);
    function awardBounty(address to, string memory uri, INetworkV2.BountyConnector calldata award) external;
    function getBountyToken(uint256 id) external view returns (INetworkV2.BountyConnector memory bountyConnector);
    function getNextId() external view returns (uint256);
    function setDispatcher(address dispatcher_) external;
}
