import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
    SMD_v5,
    SMD_v5__factory,
    Token_Mock,
    Token_Mock__factory,
} from '../typechain-types';
import {
    advanceToFuture,
    toEth,
    toDecimals,
} from './fixtures/BlockchainUtils';

describe('simulating mainnet test transaction locally', () => {
    let deployer: SignerWithAddress;
    let serhat: SignerWithAddress;
    let bruno: SignerWithAddress;
    let julia: SignerWithAddress;
    let rewardsToken: Token_Mock;
    let stakingToken: Token_Mock;
    let farmingContract: SMD_v5;

    const deploymentTimestamp = 1698691473;
    const periodOne = {
        at: 1698692920,
        rewardAmount: ethers.BigNumber.from('15000000000000000000'),
        start: 1698694200,
        end: 1698753600,
        lockDuration: 1,
    };
    const periodTwo = {
        at: 1698756395,
        rewardAmount: ethers.BigNumber.from('4000000000000000000'),
        start: 1698756600,
        end: 1698764400,
        lockDuration: 1,
    };
    const periodThree = {
        at: 1698767536,
        rewardAmount: ethers.BigNumber.from('950000000000000000'),
        start: 1698768000,
        end: 1698778800,
        lockDuration: 1,
    };
    const periodFour = {
        at: 1698780101,
        rewardAmount: ethers.BigNumber.from('5000000000000000000'),
        start: 1698780600,
        end: 1698791400,
        lockDuration: 1,
    };

    const periodOneUserAction = {
        serhat: {
            stake: {
                amount: ethers.BigNumber.from('19499439399175780'),
                at: 1698695348,
            },
        },
    };
    const periodTwoUserAction = {
        serhat: {
            renew: {
                rewardsAmount: ethers.BigNumber.from('14710101009675194901'),
                at: 1698760054,
            },
        },
        bruno: {
            stake: {
                amount: ethers.BigNumber.from('10000000000000000'),
                at: 1698762839,
            },
        },
    };
    const periodThreeUserAction = {
        serhat: {
            renew: {
                rewardsAmount: ethers.BigNumber.from('0'),
                at: 1698770699,
            },
            claim: {
                received: ethers.BigNumber.from('461771235767807234'),
                at: 1698775949,
            },
        },
        julia: {
            stake: {
                amount: ethers.BigNumber.from('1949943940539'),
                at: 1698772050,
            },
            claim: {
                received: ethers.BigNumber.from('36316272683742'),
                at: 1698776179,
            },
        },
    };
    const periodFourUserAction = {
        serhat: {
            renew: {
                rewardsAmount: ethers.BigNumber.from('250757311330929363'),
                at: 1698780820,
            },
        },
        julia: {
            stake: {
                amount: ethers.BigNumber.from('1949943940539'),
                at: 1698787130,
            },
        },
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

    it('reproduces 1st period', async () => {});
});
