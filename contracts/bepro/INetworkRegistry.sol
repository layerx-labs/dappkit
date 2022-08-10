pragma abicoder v2;

import "./BountyToken.sol";
import "./INetworkV2.sol";

interface INetworkRegistry {
    function bountyToken() external returns (BountyToken);
    function treasury() external view returns (address);
    function closeFeePercentage() external view returns (uint256);
    function cancelFeePercentage() external view returns (uint256);
    function isAllowedToken(address tokenAddress, bool transactional) external returns (bool);
    function awardBounty(address to, string memory uri, INetworkV2.BountyConnector calldata award) external;

}
