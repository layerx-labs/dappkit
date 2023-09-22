const artifact = {"abi":[{"inputs":[{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"},{"internalType":"address","name":"_dispatcher","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousGovernor","type":"address"},{"indexed":true,"internalType":"address","name":"newGovernor","type":"address"}],"name":"GovernorTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"_governor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_proposedGovernor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string","name":"uri","type":"string"},{"components":[{"internalType":"address","name":"originNetwork","type":"address"},{"internalType":"uint256","name":"bountyId","type":"uint256"},{"internalType":"uint256","name":"percentage","type":"uint256"},{"internalType":"string","name":"kind","type":"string"}],"internalType":"struct INetworkV2.BountyConnector","name":"award","type":"tuple"}],"name":"awardBounty","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimGovernor","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"dispatcher","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getBountyToken","outputs":[{"components":[{"internalType":"address","name":"originNetwork","type":"address"},{"internalType":"uint256","name":"bountyId","type":"uint256"},{"internalType":"uint256","name":"percentage","type":"uint256"},{"internalType":"string","name":"kind","type":"string"}],"internalType":"struct INetworkV2.BountyConnector","name":"bountyConnector","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getNextId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"proposedGovernor","type":"address"}],"name":"proposeGovernor","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"dispatcher_","type":"address"}],"name":"setDispatcher","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenIds","outputs":[{"internalType":"address","name":"originNetwork","type":"address"},{"internalType":"uint256","name":"bountyId","type":"uint256"},{"internalType":"uint256","name":"percentage","type":"uint256"},{"internalType":"string","name":"kind","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}],"bytecode":"0x6080604052600c80546001600160a01b03191690553480156200002157600080fd5b50604051620025ad380380620025ad8339810160408190526200004491620002bf565b8282620000586301ffc9a760e01b620000f3565b81516200006d90600690602085019062000178565b5080516200008390600790602084019062000178565b50620000966380ac58cd60e01b620000f3565b620000a8635b5e139f60e01b620000f3565b620000ba63780e9d6360e01b620000f3565b5050600b8054336001600160a01b031991821617909155600c80549091166001600160a01b039290921691909117905550620003489050565b6001600160e01b0319808216141562000153576040805162461bcd60e51b815260206004820152601c60248201527f4552433136353a20696e76616c696420696e7465726661636520696400000000604482015290519081900360640190fd5b6001600160e01b0319166000908152602081905260409020805460ff19166001179055565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282620001b05760008555620001fb565b82601f10620001cb57805160ff1916838001178555620001fb565b82800160010185558215620001fb579182015b82811115620001fb578251825591602001919060010190620001de565b50620002099291506200020d565b5090565b5b808211156200020957600081556001016200020e565b600082601f83011262000235578081fd5b81516001600160401b03808211156200024a57fe5b6040516020601f8401601f19168201810183811183821017156200026a57fe5b604052838252858401810187101562000281578485fd5b8492505b83831015620002a4578583018101518284018201529182019162000285565b83831115620002b557848185840101525b5095945050505050565b600080600060608486031215620002d4578283fd5b83516001600160401b0380821115620002eb578485fd5b620002f98783880162000224565b945060208601519150808211156200030f578384fd5b506200031e8682870162000224565b604086015190935090506001600160a01b03811681146200033d578182fd5b809150509250925092565b61225580620003586000396000f3fe60806040526004361061019c5760003560e01c806395260843116100ec578063bc9683261161008a578063cb7e905711610064578063cb7e905714610436578063d58778d61461044b578063dcc6c5a21461047b578063e985e9c51461049b5761019c565b8063bc968326146103f9578063bfc539d71461040e578063c87b56dd146104165761019c565b8063a13594bf116100c6578063a13594bf14610389578063a22cb4651461039e578063b88d4fde146103be578063ba22bd76146103d95761019c565b8063952608431461034c57806395c48bd51461036157806395d89b41146103745761019c565b806323b872dd116101595780634f6ccce7116101335780634f6ccce7146102d75780636352211e146102f75780636c0360eb1461031757806370a082311461032c5761019c565b806323b872dd146102975780632f745c59146102b757806342842e0e146102975761019c565b806301ffc9a7146101a157806306fdde03146101d7578063081812fc146101f9578063095ea7b31461022657806318160ddd1461024857806319dba3d21461026a575b600080fd5b3480156101ad57600080fd5b506101c16101bc366004611cd4565b6104bb565b6040516101ce9190611daa565b60405180910390f35b3480156101e357600080fd5b506101ec6104de565b6040516101ce9190611db5565b34801561020557600080fd5b50610219610214366004611cfc565b610574565b6040516101ce9190611d5f565b34801561023257600080fd5b50610246610241366004611ca9565b6105d6565b005b34801561025457600080fd5b5061025d6106ac565b6040516101ce9190611e5f565b34801561027657600080fd5b5061028a610285366004611cfc565b6106bd565b6040516101ce9190611e1e565b3480156102a357600080fd5b506102466102b2366004611ad1565b61019c565b3480156102c357600080fd5b5061025d6102d2366004611ca9565b6107d9565b3480156102e357600080fd5b5061025d6102f2366004611cfc565b610804565b34801561030357600080fd5b50610219610312366004611cfc565b61081a565b34801561032357600080fd5b506101ec610842565b34801561033857600080fd5b5061025d610347366004611a7d565b6108a3565b34801561035857600080fd5b5061021961090b565b61024661036f366004611a7d565b61091a565b34801561038057600080fd5b506101ec61095a565b34801561039557600080fd5b506102196109bb565b3480156103aa57600080fd5b506102466103b9366004611bab565b6109ca565b3480156103ca57600080fd5b506102466102b2366004611b11565b3480156103e557600080fd5b506102466103f4366004611a7d565b610acf565b34801561040557600080fd5b5061025d610b27565b610246610b2d565b34801561042257600080fd5b506101ec610431366004611cfc565b610baa565b34801561044257600080fd5b50610219610e2b565b34801561045757600080fd5b5061046b610466366004611cfc565b610e3a565b6040516101ce9493929190611d73565b34801561048757600080fd5b50610246610496366004611bdc565b610f0b565b3480156104a757600080fd5b506101c16104b6366004611a99565b610f95565b6001600160e01b0319811660009081526020819052604090205460ff165b919050565b60068054604080516020601f600260001961010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561056a5780601f1061053f5761010080835404028352916020019161056a565b820191906000526020600020905b81548152906001019060200180831161054d57829003601f168201915b5050505050905090565b600061057f82610fc3565b6105ba5760405162461bcd60e51b815260040180806020018281038252602c815260200180612178602c913960400191505060405180910390fd5b506000908152600460205260409020546001600160a01b031690565b60006105e18261081a565b9050806001600160a01b0316836001600160a01b031614156106345760405162461bcd60e51b81526004018080602001828103825260218152602001806121ff6021913960400191505060405180910390fd5b806001600160a01b0316610646610fd0565b6001600160a01b031614806106625750610662816104b6610fd0565b61069d5760405162461bcd60e51b81526004018080602001828103825260388152602001806120cb6038913960400191505060405180910390fd5b6106a78383610fd4565b505050565b60006106b86002611042565b905090565b6106c5611994565b600d5482106106ef5760405162461bcd60e51b81526004016106e690611de5565b60405180910390fd5b600d82815481106106fc57fe5b60009182526020918290206040805160808101825260049390930290910180546001600160a01b03168352600180820154848601526002808301548585015260038301805485516101009482161594909402600019011691909104601f810187900487028301870190945283825293949193606086019391929091908301828280156107c95780601f1061079e576101008083540402835291602001916107c9565b820191906000526020600020905b8154815290600101906020018083116107ac57829003601f168201915b5050505050815250509050919050565b6001600160a01b03821660009081526001602052604081206107fb908361104d565b90505b92915050565b600080610812600284611059565b509392505050565b60006107fe8260405180606001604052806029815260200161212d6029913960029190611075565b60098054604080516020601f600260001961010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561056a5780601f1061053f5761010080835404028352916020019161056a565b60006001600160a01b0382166108ea5760405162461bcd60e51b815260040180806020018281038252602a815260200180612103602a913960400191505060405180910390fd5b6001600160a01b03821660009081526001602052604090206107fe90611042565b600b546001600160a01b031681565b61092261108c565b336001600160a01b038216141561093857600080fd5b600a80546001600160a01b0319166001600160a01b0392909216919091179055565b60078054604080516020601f600260001961010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561056a5780601f1061053f5761010080835404028352916020019161056a565b600a546001600160a01b031681565b6109d2610fd0565b6001600160a01b0316826001600160a01b03161415610a38576040805162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c657200000000000000604482015290519081900360640190fd5b8060056000610a45610fd0565b6001600160a01b03908116825260208083019390935260409182016000908120918716808252919093529120805460ff191692151592909217909155610a89610fd0565b6001600160a01b03167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b610ad761108c565b600c546001600160a01b0382811691161415610b055760405162461bcd60e51b81526004016106e690611dc8565b600c80546001600160a01b0319166001600160a01b0392909216919091179055565b600d5490565b600a546001600160a01b03163314610b4457600080fd5b600a54600b546040516001600160a01b0392831692909116907f6fadb1c244276388aee22be93b919985a18748c021e5d48553957a48101a256090600090a3600a8054600b80546001600160a01b03199081166001600160a01b03841617909155169055565b6060610bb582610fc3565b610bf05760405162461bcd60e51b815260040180806020018281038252602f8152602001806121d0602f913960400191505060405180910390fd5b60008281526008602090815260408083208054825160026001831615610100026000190190921691909104601f810185900485028201850190935282815292909190830182828015610c835780601f10610c5857610100808354040283529160200191610c83565b820191906000526020600020905b815481529060010190602001808311610c6657829003601f168201915b505050505090506000610c94610842565b9050805160001415610ca8575090506104d9565b815115610d695780826040516020018083805190602001908083835b60208310610ce35780518252601f199092019160209182019101610cc4565b51815160209384036101000a600019018019909216911617905285519190930192850191508083835b60208310610d2b5780518252601f199092019160209182019101610d0c565b6001836020036101000a03801982511681845116808217855250505050505090500192505050604051602081830303815290604052925050506104d9565b80610d73856110a5565b6040516020018083805190602001908083835b60208310610da55780518252601f199092019160209182019101610d86565b51815160209384036101000a600019018019909216911617905285519190930192850191508083835b60208310610ded5780518252601f199092019160209182019101610dce565b6001836020036101000a0380198251168184511680821785525050505050509050019250505060405160208183030381529060405292505050919050565b600c546001600160a01b031681565b600d8181548110610e4a57600080fd5b60009182526020918290206004919091020180546001808301546002808501546003860180546040805161010097831615979097026000190190911693909304601f81018990048902860189019093528285526001600160a01b039095169750919591949391830182828015610f015780601f10610ed657610100808354040283529160200191610f01565b820191906000526020600020905b815481529060010190602001808311610ee457829003601f168201915b5050505050905084565b600c546001600160a01b03163314610f355760405162461bcd60e51b81526004016106e690611e01565b600d54610f428482611180565b610f4c818461119e565b600d805460018101825560009190915282906004027fd7b6990105719101dabeb77144f2a3385c8033acd3af97e9423a695e81ad1eb501610f8d8282611fa4565b505050505050565b6001600160a01b03918216600090815260056020908152604080832093909416825291909152205460ff1690565b60006107fe600283611201565b3390565b600081815260046020526040902080546001600160a01b0319166001600160a01b03841690811790915581906110098261081a565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b60006107fe8261120d565b60006107fb8383611211565b60008080806110688686611275565b9097909650945050505050565b60006110828484846112f0565b90505b9392505050565b600b546001600160a01b031633146110a357600080fd5b565b6060816110ca57506040805180820190915260018152600360fc1b60208201526104d9565b8160005b81156110e257600101600a820491506110ce565b60008167ffffffffffffffff811180156110fb57600080fd5b506040519080825280601f01601f191660200182016040528015611126576020820181803683370190505b50859350905060001982015b831561117757600a840660300160f81b8282806001900393508151811061115557fe5b60200101906001600160f81b031916908160001a905350600a84049350611132565b50949350505050565b61119a8282604051806020016040528060008152506113ba565b5050565b6111a782610fc3565b6111e25760405162461bcd60e51b815260040180806020018281038252602c8152602001806121a4602c913960400191505060405180910390fd5b600082815260086020908152604090912082516106a7928401906119c5565b60006107fb838361140c565b5490565b815460009082106112535760405162461bcd60e51b81526004018080602001828103825260228152602001806120516022913960400191505060405180910390fd5b82600001828154811061126257fe5b9060005260206000200154905092915050565b8154600090819083106112b95760405162461bcd60e51b81526004018080602001828103825260228152602001806121566022913960400191505060405180910390fd5b60008460000184815481106112ca57fe5b906000526020600020906002020190508060000154816001015492509250509250929050565b6000828152600184016020526040812054828161138b5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015611350578181015183820152602001611338565b50505050905090810190601f16801561137d5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5084600001600182038154811061139e57fe5b9060005260206000209060020201600101549150509392505050565b6113c48383611424565b6113d16000848484611552565b6106a75760405162461bcd60e51b81526004018080602001828103825260328152602001806120736032913960400191505060405180910390fd5b60009081526001919091016020526040902054151590565b6001600160a01b03821661147f576040805162461bcd60e51b815260206004820181905260248201527f4552433732313a206d696e7420746f20746865207a65726f2061646472657373604482015290519081900360640190fd5b61148881610fc3565b156114da576040805162461bcd60e51b815260206004820152601c60248201527f4552433732313a20746f6b656e20616c7265616479206d696e74656400000000604482015290519081900360640190fd5b6114e6600083836106a7565b6001600160a01b038216600090815260016020526040902061150890826116bb565b50611515600282846116c7565b5060405181906001600160a01b038416906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a45050565b6000611566846001600160a01b03166116dd565b611572575060016116b3565b6000611680630a85bd0160e11b611587610fd0565b88878760405160240180856001600160a01b03168152602001846001600160a01b0316815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b838110156115ee5781810151838201526020016115d6565b50505050905090810190601f16801561161b5780820380516001836020036101000a031916815260200191505b5095505050505050604051602081830303815290604052906001600160e01b0319166020820180516001600160e01b038381831617835250505050604051806060016040528060328152602001612073603291396001600160a01b03881691906116e3565b9050600081806020019051602081101561169957600080fd5b50516001600160e01b031916630a85bd0160e11b14925050505b949350505050565b60006107fb83836116f2565b600061108284846001600160a01b03851661173c565b3b151590565b606061108284846000856117d3565b60006116fe838361140c565b611734575081546001818101845560008481526020808220909301849055845484825282860190935260409020919091556107fe565b5060006107fe565b6000828152600184016020526040812054806117a1575050604080518082018252838152602080820184815286546001818101895560008981528481209551600290930290950191825591519082015586548684528188019092529290912055611085565b828560000160018303815481106117b457fe5b9060005260206000209060020201600101819055506000915050611085565b6060824710156118145760405162461bcd60e51b81526004018080602001828103825260268152602001806120a56026913960400191505060405180910390fd5b61181d856116dd565b61186e576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b600080866001600160a01b031685876040518082805190602001908083835b602083106118ac5780518252601f19909201916020918201910161188d565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d806000811461190e576040519150601f19603f3d011682016040523d82523d6000602084013e611913565b606091505b509150915061192382828661192e565b979650505050505050565b6060831561193d575081611085565b82511561194d5782518084602001fd5b60405162461bcd60e51b8152602060048201818152845160248401528451859391928392604401919085019080838360008315611350578181015183820152602001611338565b604051806080016040528060006001600160a01b031681526020016000815260200160008152602001606081525090565b828054600181600116156101000203166002900490600052602060002090601f0160209004810192826119fb5760008555611a41565b82601f10611a1457805160ff1916838001178555611a41565b82800160010185558215611a41579182015b82811115611a41578251825591602001919060010190611a26565b50611a4d929150611a51565b5090565b5b80821115611a4d5760008155600101611a52565b600060808284031215611a77578081fd5b50919050565b600060208284031215611a8e578081fd5b813561108581612038565b60008060408385031215611aab578081fd5b8235611ab681612038565b91506020830135611ac681612038565b809150509250929050565b600080600060608486031215611ae5578081fd5b8335611af081612038565b92506020840135611b0081612038565b929592945050506040919091013590565b600080600080600060808688031215611b28578081fd5b8535611b3381612038565b94506020860135611b4381612038565b935060408601359250606086013567ffffffffffffffff80821115611b66578283fd5b818801915088601f830112611b79578283fd5b813581811115611b87578384fd5b896020828501011115611b98578384fd5b9699959850939650602001949392505050565b60008060408385031215611bbd578182fd5b8235611bc881612038565b915060208301358015158114611ac6578182fd5b600080600060608486031215611bf0578283fd5b8335611bfb81612038565b925060208481013567ffffffffffffffff80821115611c18578485fd5b818701915087601f830112611c2b578485fd5b813581811115611c3757fe5b604051601f8201601f1916810185018381118282101715611c5457fe5b60405281815283820185018a1015611c6a578687fd5b81858501868301378685838301015280965050506040870135925080831115611c91578384fd5b5050611c9f86828701611a66565b9150509250925092565b60008060408385031215611cbb578182fd5b8235611cc681612038565b946020939093013593505050565b600060208284031215611ce5578081fd5b81356001600160e01b031981168114611085578182fd5b600060208284031215611d0d578081fd5b5035919050565b60008151808452815b81811015611d3957602081850181015186830182015201611d1d565b81811115611d4a5782602083870101525b50601f01601f19169290920160200192915050565b6001600160a01b0391909116815260200190565b600060018060a01b038616825284602083015283604083015260806060830152611da06080830184611d14565b9695505050505050565b901515815260200190565b6000602082526107fb6020830184611d14565b60208082526003908201526205344360ec1b604082015260600190565b602080825260029082015261042360f41b604082015260600190565b60208082526003908201526204142360ec1b604082015260600190565b60006020825260018060a01b038351166020830152602083015160408301526040830151606083015260608301516080808401526116b360a0840182611d14565b90815260200190565b60009081526020902090565b5b8181101561119a5760008155600101611e75565b67ffffffffffffffff831115611e9b57fe5b611ea58154611f7b565b600080601f8611601f841181811715611ec457611ec186611e68565b92505b8015611ef3576020601f89010483016020891015611edf5750825b611ef16020601f880104850182611e74565b505b508060018114611f1f57600094508715611f0e578387013594505b611f188886611f91565b8655611f71565b601f198816945082845b86811015611f495788860135825560209586019560019092019101611f29565b5088861015611f6657878501356000196008601f8c16021c191681555b506001600289020186555b5050505050505050565b6002610100600183161502600019019091160490565b600019600883021c191660029091021790565b8135611faf81612038565b81546001600160a01b0319166001600160a01b03919091161781556020820135600182015560408201356002820155606082013536839003601e19018112611ff657600080fd5b8201803567ffffffffffffffff81111561200f57600080fd5b60208201915080360382131561202457600080fd5b612032818360038601611e89565b50505050565b6001600160a01b038116811461204d57600080fd5b5056fe456e756d657261626c655365743a20696e646578206f7574206f6620626f756e64734552433732313a207472616e7366657220746f206e6f6e20455243373231526563656976657220696d706c656d656e746572416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c4552433732313a20617070726f76652063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f76656420666f7220616c6c4552433732313a2062616c616e636520717565727920666f7220746865207a65726f20616464726573734552433732313a206f776e657220717565727920666f72206e6f6e6578697374656e7420746f6b656e456e756d657261626c654d61703a20696e646578206f7574206f6620626f756e64734552433732313a20617070726f76656420717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732314d657461646174613a2055524920736574206f66206e6f6e6578697374656e7420746f6b656e4552433732314d657461646174613a2055524920717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76616c20746f2063757272656e74206f776e6572a264697066735822122085f268b86fd379f00acd1c53f32da3604b4f45533e1fcc5c9311220cdc00fda464736f6c63430007060033","contractName":"BountyToken"} as const;
export default artifact;