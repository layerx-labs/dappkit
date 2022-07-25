pragma solidity >=0.6.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../utils/Governed.sol";

contract BountyToken is ERC721, Governed {

    struct BountyConnector {
        uint256 bountyId;
        uint percentage; // 0 - 100
        // todo add if proposer, dev, or closer
    }

    address public dispatcher = address(0);

    constructor(string memory name_, string memory symbol_, address _dispatcher) ERC721(name_, symbol_) Governed() {
        dispatcher = _dispatcher;
    }

    BountyConnector[] tokenIds;

    function awardBounty(address to, string memory uri, uint256 bountyId, uint percentage) public payable {
        require(msg.sender == dispatcher, "AB0");
        uint256 id = tokenIds.length;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        tokenIds.push(BountyConnector(bountyId, percentage));
    }

    function getBountyToken(uint256 id) public view returns (BountyConnector memory bountyConnector) {
        require(tokenIds.length <= id, "B0");
        return tokenIds[id];
    }

    function setDispatcher(address dispatcher_) public payable onlyGovernor {
        require(dispatcher_ != dispatcher, "SD0");
        dispatcher = dispatcher_;
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {}
    function safeTransferFrom(address from, address to, uint256 tokenId) public override {}
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) public override {}
}
