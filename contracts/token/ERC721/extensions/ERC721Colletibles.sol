// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "../utils/Opener.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Collectibles is Opener, ERC721 {

    constructor (
        string memory name, string memory symbol,
        uint256 limitedAmount,
        ERC20 _purchaseToken,
        address baseFeeAddress,
        address feeAddress,
        address otherAddress) public ERC721(name, symbol) Opener(_purchaseToken, baseFeeAddress, feeAddress, otherAddress, limitedAmount) {}

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _setBaseURI(baseURI);
    }

    function mint(uint256 tokenIdToMint) public {
        require(
            tokenIdToMint <= _currentTokenId,
            "Token Id not registered"
        );

        require(registeredIDs[msg.sender][tokenIdToMint], "Token was not registered or not the rightful owner");
        require(!alreadyMinted[tokenIdToMint], "Already minted");

        alreadyMinted[tokenIdToMint] = true;
        _safeMint(msg.sender, tokenIdToMint);
    }

    function openPack(uint256 amount) public {
        _openPack(amount);
    }

    function getRegisteredIDs(address _address) public view returns(uint256[] memory) {
        return registeredIDsArray[_address];
    }
}