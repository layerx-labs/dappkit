pragma solidity >=0.6.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../utils/Dispatcher.sol";
import "../utils/Ownable.sol";

enum BountyRoles { Proposer, Developer, Reviewer, Creator, Other }

contract BountyToken is ERC721, Dispatcher, Ownable {

    struct BountyConnector {
        uint256 bountyId;
        uint percentage; // 0 - 100
        BountyRoles role;
    }

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable() Dispatcher() {}

    BountyConnector[] tokenIds;

    function awardBounty(
        address to,
        string memory uri,
        uint256 bountyId,
        uint percentage,
        BountyRoles memory role
    ) public payable onlyDispatcher {
        uint256 id = tokenIds.length;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        tokenIds.push(BountyConnector(bountyId, percentage));
    }

    function getBountyToken(uint256 id) public view returns (BountyConnector memory bountyConnector) {
        require(tokenIds.length <= id, "B0");
        return tokenIds[id];
    }

    function setDispatcher(address dispatcher_) public payable onlyOwner {
        _setDispatcher(dispatcher_);
    }
}
