import 'dotenv/config';
// import {ERC4626} from '@models/erc4626';
// import {ERC20} from '@models/erc20';
import {toSmartContractDecimals} from '@utils/numbers'
import {expect} from 'chai';
import {defaultWeb3Connection, erc20Deployer} from '../utils/';
import {Web3Connection, ERC4626} from '../../src';


describe(`ERC4626`, () => {
    // let erc20: ERC20;
    // let erc4626: ERC4626
    let tokenAddress: string;

    const capAmount = '1000000';
    const cap = toSmartContractDecimals(capAmount, 18);
    const name = `BEPRO`;
    const symbol = `$BEPRO`;

    let erc4626ContractAddress: string;

    let web3Connection: Web3Connection

    before(async () => {
        web3Connection = await defaultWeb3Connection(true, true)
    })

    describe(`Deploy`, () => {
        it(`Deploys an ERC20 Token Contract`, async () => {
            const receipt = await erc20Deployer(name, symbol, cap, web3Connection);
            expect(receipt.contractAddress).to.not.be.empty;
            tokenAddress = receipt.contractAddress;
        });

        it(`ERC4626 Contract`,async () => {
            const deployer = new ERC4626(web3Connection);
            await deployer.loadAbi()

            const receipt = await deployer.deployJsonAbi(tokenAddress);
            expect(receipt.contractAddress).to.not.be.empty;
            erc4626ContractAddress = receipt.contractAddress
        })
    })

    describe(`Integration`, () => {
        let erc4626: ERC4626;

        before(async () => {
            erc4626 = new ERC4626(web3Connection, erc4626ContractAddress);
            await erc4626.loadContract()
        })

    })
})