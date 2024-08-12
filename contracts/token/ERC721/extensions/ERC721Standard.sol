// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../../../access/Ownable.sol";

contract ERC721Standard is ERC721, Ownable {

    constructor (string memory name, string memory symbol) public ERC721(name, symbol) { }

    function mint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    function mint(address to, uint256 tokenId, bytes memory _data) public onlyOwner {
        _safeMint(to, tokenId, _data);
    }
}