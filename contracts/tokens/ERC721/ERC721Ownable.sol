pragma solidity >=0.6.0;

import "../../utils/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Ownable is Ownable, ERC721 {
    constructor(string memory name_, string memory symbol_) Ownable() ERC721(name_, symbol_) public {}

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _setBaseURI(baseURI);
    }

    function mint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    function mint(address to, uint256 tokenId, bytes memory _data) public onlyOwner {
        _safeMint(to, tokenId, _data);
    }
}
