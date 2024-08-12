// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../../../access/Ownable.sol";

contract ERC1155Ownable is ERC1155, Ownable {

    constructor (string memory uri) public ERC1155(uri) Ownable() { }

    function setURI(string memory uri) public onlyOwner {
        _setURI(uri);
    }

    function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) public onlyOwner {
        _mint(to, tokenId, amount, data);
    }

    function mintBatch(address to, uint256[] memory tokenIds, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(to, tokenIds, amounts, data);
    }
}