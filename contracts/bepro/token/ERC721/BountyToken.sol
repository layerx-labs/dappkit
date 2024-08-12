pragma solidity >=0.8.0;
pragma abicoder v2;

import "../../../access/Governed.sol";
import "../../INetworkV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/*
 * A BountyToken is a non-transferable NFT that tracks the record of participation of a certain address on a
 * @INetworkV2.Bounty
 */
contract BountyToken is ERC721URIStorage, Governed {

    address public dispatcher = address(0);

    constructor(string memory name_, string memory symbol_, address _dispatcher) ERC721URIStorage() ERC721(name_, symbol_) Governed() {
        dispatcher = _dispatcher;
    }

    INetworkV2.BountyConnector[] public tokenIds;

    /*
     * Alias to safeMint
     *
     * Assert rules,
     *  msg.sender must be dispatcher
     */
    function awardBounty(address to, string memory uri, INetworkV2.BountyConnector calldata award) external {
        require(msg.sender == dispatcher, "AB0");
        uint256 id = tokenIds.length;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        tokenIds.push(award);
    }

    /*
     * Get the underlying NFT information that correlates to a bounty
     * Assert rules,
     *   id must be withing bounds
     */
    function getBountyToken(uint256 id) external view returns (INetworkV2.BountyConnector memory bountyConnector) {
        require(id < tokenIds.length, "B0");
        return tokenIds[id];
    }

    function getNextId() external view returns (uint256) {
        return tokenIds.length;
    }

    /*
     * Allow governor to change dispatcher
     * Assert rules,
     *   dispatcher can't be equal to previous dispatcher address
     */
    function setDispatcher(address dispatcher_) external onlyGovernor {
        require(dispatcher_ != dispatcher, "SD0");
        dispatcher = dispatcher_;
    }

    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) { revert(); }
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override(ERC721, IERC721) { revert(); }
}
