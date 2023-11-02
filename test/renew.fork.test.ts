import { time } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumberish } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
    SMD_v5,
    SMD_v5__factory,
    Token_Mock,
    Token_Mock__factory,
} from '../typechain-types';
import { advanceToFuture } from './fixtures/BlockchainUtils';

describe('simulating mainnet test transaction locally', () => {
    let deployer: SignerWithAddress;
    let serhat: SignerWithAddress;
    let bruno: SignerWithAddress;
    let julia: SignerWithAddress;
    let rewardsToken: Token_Mock;
    let stakingToken: Token_Mock;
    let farmingContract: SMD_v5;

    //Simulate the blockchain is 60s in future to prevent timestamp issues running time-based tests
    const offset = 60;
    const deploymentTimestamp = 1698648273;
    const periodOne = {
        at: 1698692920,
        rewardAmount: 15000000000000000000,
        start: 1698694200,
        end: 1698753600,
        lockDuration: 1,
    };
    const periodTwo = {
        at: 1698756395,
        rewardAmount: 4000000000000000000,
        start: 1698756600,
        end: 1698764400,
        lockDuration: 1,
    };
    const periodThree = {
        at: 1698767536,
        rewardAmount: 950000000000000000,
        start: 1698768000,
        end: 1698778800,
        lockDuration: 1,
    };
    const periodFour = {
        at: 1698780101,
        rewardAmount: 5000000000000000000,
        start: 1698780600,
        end: 1698791400,
        lockDuration: 1,
    };

    const periodOneUserAction = {
        serhat: { stake: { amount: 19499439399175780, at: 1698695348 } },
    };
    const periodTwoUserAction = {
        serhat: {
            renew: { rewardsAmount: 14710101009675194901, at: 1698760054 },
        },
        bruno: { stake: { amount: 10000000000000000, at: 1698762839 } },
    };
    const periodThreeUserAction = {
        serhat: {
            renew: { rewardsAmount: 0, at: 1698770699 },
            claim: { received: 461771235767807234, at: 1698775949 },
        },
        julia: {
            stake: { amount: 1949943940539, at: 1698772050 },
            claim: { received: 36316272683742, at: 1698776179 },
        },
    };
    const periodFourUserAction = {
        serhat: {
            renew: { rewardsAmount: 250757311330929363, at: 1698780820 },
        },
        julia: { stake: { amount: 1949943940539, at: 1698787130 } },
    };

    beforeEach(async () => {
        [deployer, serhat, bruno, julia] = await ethers.getSigners();
        stakingToken = await new Token_Mock__factory(deployer).deploy();
        rewardsToken = await new Token_Mock__factory(deployer).deploy();
        farmingContract = await new SMD_v5__factory(deployer).deploy(
            stakingToken.address,
            rewardsToken.address
        );

        await rewardsToken.mint(deployer.address, toEth('1000000'));
        await stakingToken.mint(serhat.address, toEth('100000'));
        await stakingToken.mint(bruno.address, toEth('100000'));
        await stakingToken.mint(julia.address, toEth('100000'));
        await rewardsToken
            .connect(deployer)
            .approve(farmingContract.address, toEth('1000000'));
        await stakingToken
            .connect(serhat)
            .approve(farmingContract.address, toEth('1000000'));
        await stakingToken
            .connect(julia)
            .approve(farmingContract.address, toEth('1000000'));

        await advanceToFuture(deploymentTimestamp);
    });

    it('then rewards are distributed to the serhat for previous periods', async () => {});
});

function toEth(wei: string) {
    return ethers.utils.parseEther(wei);
}

function toDecimals(wei: BigNumberish): string {
    return ethers.utils.formatUnits(wei, 18);
}
