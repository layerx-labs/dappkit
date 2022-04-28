// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Standard is ERC1155 {

    constructor (string memory uri) public ERC1155(uri) { }

    function setURI(string memory uri) public {
        _setURI(uri);
    }

    function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) public {
        _mint(to, tokenId, amount, data);
    }

    function mintBatch(address to, uint256[] memory tokenIds, uint256[] memory amounts, bytes memory data) public {
        _mintBatch(to, tokenIds, amounts, data);
    }

}