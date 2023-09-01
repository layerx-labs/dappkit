const artifact = {"abi":[{"inputs":[{"internalType":"contract Token","name":"asset_","type":"address"},{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"asset","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"convertToAssets","outputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"convertToShares","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"redeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}],"bytecode":"0x60c06040523480156200001157600080fd5b5060405162001bbd38038062001bbd833981810160405260608110156200003757600080fd5b8151602083018051604051929492938301929190846401000000008211156200005f57600080fd5b9083019060208201858111156200007557600080fd5b82516401000000008111828201881017156200009057600080fd5b82525081516020918201929091019080838360005b83811015620000bf578181015183820152602001620000a5565b50505050905090810190601f168015620000ed5780820380516001836020036101000a031916815260200191505b50604052602001805160405193929190846401000000008211156200011157600080fd5b9083019060208201858111156200012757600080fd5b82516401000000008111828201881017156200014257600080fd5b82525081516020918201929091019080838360005b838110156200017157818101518382015260200162000157565b50505050905090810190601f1680156200019f5780820380516001836020036101000a031916815260200191505b50604052505082518391508290620001bf90600390602085019062000385565b508051620001d590600490602084019062000385565b50506005805460ff1916601217905550600080620001f3856200024e565b915091506200020c6200037c60201b62000bd01760201c565b60f81b7fff000000000000000000000000000000000000000000000000000000000000001660a0525050505060601b6001600160601b03191660805262000431565b60408051600481526024810182526020810180516001600160e01b031663313ce56760e01b178152915181516000938493849384936001600160a01b0389169382918083835b60208310620002b55780518252601f19909201916020918201910162000294565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855afa9150503d806000811462000317576040519150601f19603f3d011682016040523d82523d6000602084013e6200031c565b606091505b50915091508180156200033157506020815110155b156200036d5760008180602001905160208110156200034f57600080fd5b5051905060ff81116200036b5760019450925062000377915050565b505b6000809350935050505b915091565b60055460ff1690565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282620003bd576000855562000408565b82601f10620003d857805160ff191683800117855562000408565b8280016001018555821562000408579182015b8281111562000408578251825591602001919060010190620003eb565b50620004169291506200041a565b5090565b5b808211156200041657600081556001016200041b565b60805160601c60a05160f81c6117536200046a600039806107b45250806105b552806107d85280610f9f52806110e552506117536000f3fe608060405234801561001057600080fd5b50600436106101a95760003560e01c806370a08231116100f9578063ba08765211610097578063ce96cb7711610071578063ce96cb7714610537578063d905777e1461055d578063dd62ed3e14610583578063ef8b30f71461051a576101a9565b8063ba087652146104c0578063c63d75b6146104f4578063c6e6f5921461051a576101a9565b8063a457c2d7116100d3578063a457c2d714610417578063a9059cbb14610443578063b3d7f6b91461046f578063b460af941461048c576101a9565b806370a08231146103bd57806394bf804d146103e357806395d89b411461040f576101a9565b806323b872dd116101665780633950935111610140578063395093511461033f578063402d267d1461036b5780634cdad506146102455780636e553f6514610391576101a9565b806323b872dd146102c7578063313ce567146102fd57806338d52e0f1461031b576101a9565b806301e1d114146101ae57806306fdde03146101c857806307a2d13a14610245578063095ea7b3146102625780630a28a477146102a257806318160ddd146102bf575b600080fd5b6101b66105b1565b60408051918252519081900360200190f35b6101d0610651565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561020a5781810151838201526020016101f2565b50505050905090810190601f1680156102375780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101b66004803603602081101561025b57600080fd5b50356106e7565b61028e6004803603604081101561027857600080fd5b506001600160a01b0381351690602001356106fa565b604080519115158252519081900360200190f35b6101b6600480360360208110156102b857600080fd5b5035610717565b6101b6610724565b61028e600480360360608110156102dd57600080fd5b506001600160a01b0381358116916020810135909116906040013561072a565b6103056107b2565b6040805160ff9092168252519081900360200190f35b6103236107d6565b604080516001600160a01b039092168252519081900360200190f35b61028e6004803603604081101561035557600080fd5b506001600160a01b0381351690602001356107fa565b6101b66004803603602081101561038157600080fd5b50356001600160a01b0316610848565b6101b6600480360360408110156103a757600080fd5b50803590602001356001600160a01b0316610866565b6101b6600480360360208110156103d357600080fd5b50356001600160a01b03166108e5565b6101b6600480360360408110156103f957600080fd5b50803590602001356001600160a01b0316610900565b6101d061097f565b61028e6004803603604081101561042d57600080fd5b506001600160a01b0381351690602001356109e0565b61028e6004803603604081101561045957600080fd5b506001600160a01b038135169060200135610a48565b6101b66004803603602081101561048557600080fd5b5035610a5c565b6101b6600480360360608110156104a257600080fd5b508035906001600160a01b0360208201358116916040013516610a69565b6101b6600480360360608110156104d657600080fd5b508035906001600160a01b0360208201358116916040013516610af1565b6101b66004803603602081101561050a57600080fd5b50356001600160a01b0316610b71565b6101b66004803603602081101561053057600080fd5b5035610b78565b6101b66004803603602081101561054d57600080fd5b50356001600160a01b0316610b85565b6101b66004803603602081101561057357600080fd5b50356001600160a01b0316610b9a565b6101b66004803603604081101561059957600080fd5b506001600160a01b0381358116916020013516610ba5565b60007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166370a08231306040518263ffffffff1660e01b815260040180826001600160a01b0316815260200191505060206040518083038186803b15801561062057600080fd5b505afa158015610634573d6000803e3d6000fd5b505050506040513d602081101561064a57600080fd5b5051905090565b60038054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156106dd5780601f106106b2576101008083540402835291602001916106dd565b820191906000526020600020905b8154815290600101906020018083116106c057829003601f168201915b5050505050905090565b60006106f4826000610bd9565b92915050565b600061070e610707610c0f565b8484610c13565b50600192915050565b60006106f4826001610cff565b60025490565b6000610737848484610d30565b6107a784610743610c0f565b6107a285604051806060016040528060288152602001611667602891396001600160a01b038a16600090815260016020526040812090610781610c0f565b6001600160a01b031681526020810191909152604001600020549190610e8b565b610c13565b5060015b9392505050565b7f000000000000000000000000000000000000000000000000000000000000000090565b7f000000000000000000000000000000000000000000000000000000000000000090565b600061070e610807610c0f565b846107a28560016000610818610c0f565b6001600160a01b03908116825260208083019390935260409182016000908120918c168152925290205490610f22565b6000610852610f7c565b61085d5760006106f4565b50600019919050565b600061087182610848565b8311156108c5576040805162461bcd60e51b815260206004820152601e60248201527f455243343632363a206465706f736974206d6f7265207468616e206d61780000604482015290519081900360640190fd5b60006108d084610b78565b90506107ab6108dd610c0f565b848684610f9d565b6001600160a01b031660009081526020819052604090205490565b600061090b82610b71565b83111561095f576040805162461bcd60e51b815260206004820152601b60248201527f455243343632363a206d696e74206d6f7265207468616e206d61780000000000604482015290519081900360640190fd5b600061096a84610a5c565b90506107ab610977610c0f565b848387610f9d565b60048054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156106dd5780601f106106b2576101008083540402835291602001916106dd565b600061070e6109ed610c0f565b846107a2856040518060600160405280602581526020016116f96025913960016000610a17610c0f565b6001600160a01b03908116825260208083019390935260409182016000908120918d16815292529020549190610e8b565b600061070e610a55610c0f565b8484610d30565b60006106f4826001610bd9565b6000610a7482610b85565b841115610ac8576040805162461bcd60e51b815260206004820152601f60248201527f455243343632363a207769746864726177206d6f7265207468616e206d617800604482015290519081900360640190fd5b6000610ad385610717565b9050610ae9610ae0610c0f565b858588856110b5565b949350505050565b6000610afc82610b9a565b841115610b50576040805162461bcd60e51b815260206004820152601d60248201527f455243343632363a2072656465656d206d6f7265207468616e206d6178000000604482015290519081900360640190fd5b6000610b5b856106e7565b9050610ae9610b68610c0f565b858584896110b5565b5060001990565b60006106f4826000610cff565b60006106f4610b93836108e5565b6000610bd9565b60006106f4826108e5565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b60055460ff1690565b600080610be4610724565b90508015610c0557610c00610bf76105b1565b859083866111db565b610ae9565b610ae98484611222565b3390565b6001600160a01b038316610c585760405162461bcd60e51b81526004018080602001828103825260248152602001806116d56024913960400191505060405180910390fd5b6001600160a01b038216610c9d5760405162461bcd60e51b815260040180806020018281038252602281526020018061161f6022913960400191505060405180910390fd5b6001600160a01b03808416600081815260016020908152604080832094871680845294825291829020859055815185815291517f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259281900390910190a3505050565b600080610d0a610724565b9050831580610d17575080155b610c0557610c0081610d276105b1565b869190866111db565b6001600160a01b038316610d755760405162461bcd60e51b81526004018080602001828103825260258152602001806116b06025913960400191505060405180910390fd5b6001600160a01b038216610dba5760405162461bcd60e51b81526004018080602001828103825260238152602001806115da6023913960400191505060405180910390fd5b610dc5838383611226565b610e0281604051806060016040528060268152602001611641602691396001600160a01b0386166000908152602081905260409020549190610e8b565b6001600160a01b038085166000908152602081905260408082209390935590841681522054610e319082610f22565b6001600160a01b038084166000818152602081815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b60008184841115610f1a5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610edf578181015183820152602001610ec7565b50505050905090810190601f168015610f0c5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b6000828201838110156107ab576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b600080610f876105b1565b1180610f985750610f96610724565b155b905090565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166323b872dd8530856040518463ffffffff1660e01b815260040180846001600160a01b03168152602001836001600160a01b031681526020018281526020019350505050602060405180830381600087803b15801561102557600080fd5b505af1158015611039573d6000803e3d6000fd5b505050506040513d602081101561104f57600080fd5b5061105c9050838261122b565b826001600160a01b0316846001600160a01b03167fdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d78484604051808381526020018281526020019250505060405180910390a350505050565b826001600160a01b0316856001600160a01b0316146110d9576110d983868361131b565b6110e3838261139a565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663a9059cbb85846040518363ffffffff1660e01b815260040180836001600160a01b0316815260200182815260200192505050602060405180830381600087803b15801561115a57600080fd5b505af115801561116e573d6000803e3d6000fd5b505050506040513d602081101561118457600080fd5b5050604080518381526020810183905281516001600160a01b038087169388821693918a16927ffbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db9281900390910190a45050505050565b6000806111e9868686611496565b905060018360028111156111f957fe5b14801561121057506000848061120b57fe5b868809115b15611219576001015b95945050505050565b5090565b505050565b6001600160a01b038216611286576040805162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015290519081900360640190fd5b61129260008383611226565b60025461129f9082610f22565b6002556001600160a01b0382166000908152602081905260409020546112c59082610f22565b6001600160a01b0383166000818152602081815260408083209490945583518581529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35050565b60006113278484610ba5565b905060001981146113945781811015611387576040805162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000604482015290519081900360640190fd5b6113948484848403610c13565b50505050565b6001600160a01b0382166113df5760405162461bcd60e51b815260040180806020018281038252602181526020018061168f6021913960400191505060405180910390fd5b6113eb82600083611226565b611428816040518060600160405280602281526020016115fd602291396001600160a01b0385166000908152602081905260409020549190610e8b565b6001600160a01b03831660009081526020819052604090205560025461144e908261157c565b6002556040805182815290516000916001600160a01b038516917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9181900360200190a35050565b60008080600019858709868602925082811090839003039050806114c7578382816114bd57fe5b04925050506107ab565b808411611513576040805162461bcd60e51b81526020600482015260156024820152744d6174683a206d756c446976206f766572666c6f7760581b604482015290519081900360640190fd5b60008486880960026001871981018816978890046003810283188082028403028082028403028082028403028082028403028082028403029081029092039091026000889003889004909101858311909403939093029303949094049190911702949350505050565b6000828211156115d3576040805162461bcd60e51b815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b5090039056fe45524332303a207472616e7366657220746f20746865207a65726f206164647265737345524332303a206275726e20616d6f756e7420657863656564732062616c616e636545524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636545524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a206275726e2066726f6d20746865207a65726f206164647265737345524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa2646970667358221220b6ab145fcd071cd2e416cf9620a9f48e249ba98fb0228fa29a5ca346c668918664736f6c63430007060033","contractName":"ERC4626"} as const;
export default artifact;