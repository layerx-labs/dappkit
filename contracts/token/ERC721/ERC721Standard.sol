// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../../utils/Ownable.sol";

contract ERC721Standard is ERC721, Ownable {

    constructor (string memory name, string memory symbol) public ERC721(name, symbol) { }

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