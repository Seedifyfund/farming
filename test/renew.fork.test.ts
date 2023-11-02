import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';

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
    let julia: SignerWithAddress;
    let bruno: SignerWithAddress;
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
        julia: {
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
        bruno: {
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
        bruno: {
            stake: {
                amount: ethers.BigNumber.from('1949943940539'),
                at: 1698787130,
            },
        },
    };

    beforeEach(async () => {
        await time.increaseTo(deploymentTimestamp);

        [deployer, serhat, julia, bruno] = await ethers.getSigners();
        stakingToken = await new Token_Mock__factory(deployer).deploy();
        rewardsToken = await new Token_Mock__factory(deployer).deploy();
        farmingContract = await new SMD_v5__factory(deployer).deploy(
            stakingToken.address,
            rewardsToken.address
        );

        await rewardsToken.mint(deployer.address, toEth('1000000'));
        await stakingToken.mint(serhat.address, toEth('100000'));
        await stakingToken.mint(julia.address, toEth('100000'));
        await stakingToken.mint(bruno.address, toEth('100000'));
        await rewardsToken
            .connect(deployer)
            .approve(farmingContract.address, toEth('1000000'));
        await stakingToken
            .connect(serhat)
            .approve(farmingContract.address, toEth('1000000'));
        await stakingToken
            .connect(bruno)
            .approve(farmingContract.address, toEth('1000000'));
    });

    it('reproduces 1st period, until it is closed by 2nd period opening', async () => {
        ////////// period 1 set up //////////
        time.increaseTo(periodOne.at);

        await farmingContract.setNewPeriod(
            periodOne.rewardAmount,
            periodOne.start,
            periodOne.end,
            periodOne.lockDuration
        );
        expect(await farmingContract.totalReward()).eq(periodOne.rewardAmount);
        expect(await farmingContract.rewardBalance()).eq(
            periodOne.rewardAmount
        );

        ////////// user action //////////
        await time.increaseTo(periodOneUserAction.serhat.stake.at);
        await farmingContract
            .connect(serhat)
            .stake(periodOneUserAction.serhat.stake.amount);
        // period not ended so detailed not saved yet
        verifyEmptyStruct(await farmingContract.endAccShare(1));

        // get some period details for rewards calculation
        const stakedBalanceCurrPeriod: BigNumber =
            await farmingContract.stakedBalanceCurrPeriod();
        const rewBalance = await farmingContract.rewardBalance();
        const endingDate: BigNumber = await farmingContract.endingDate();
        let lastSharesUpdateTime: BigNumber =
            await farmingContract.lastSharesUpdateTime();
        let secSinceLastPeriod: BigNumber = endingDate.sub(
            lastSharesUpdateTime
        );
        let rewPerSec: BigNumber = await farmingContract.rewPerSecond();
        let rewards: BigNumber = secSinceLastPeriod.mul(rewPerSec);
        console.log('rewards', rewards);

        const oldRewardBalance = await farmingContract.rewardBalance();

        ////////// open period 2 //////////
        await time.increaseTo(periodTwo.at);
        await farmingContract.setNewPeriod(
            periodTwo.rewardAmount,
            periodTwo.start,
            periodTwo.end,
            periodTwo.lockDuration
        );
        expect(await farmingContract.periodCounter()).eq(2);
        //// verify period 1 saved details, on period 2 opening ////
        const periodOneEndAccShare = await farmingContract.endAccShare(1);
        expect(periodOneEndAccShare.periodCounter).eq(1);
        expect(periodOneEndAccShare.accShare).eq(
            rewards.mul(1e6).div(stakedBalanceCurrPeriod)
        );
        expect(periodOneEndAccShare.rewPerSecond).eq(
            periodOne.rewardAmount.div(periodOne.end - periodOne.start)
        );
        expect(periodOneEndAccShare.startingDate).eq(periodOne.start);
        expect(periodOneEndAccShare.endingDate).eq(periodOne.end);
        expect(periodOneEndAccShare.rewards).eq(rewBalance);
        // check current period 2 details are set to 0
        verifyEmptyStruct(await farmingContract.endAccShare(2));
        expect(await farmingContract.totalReward()).eq(periodTwo.rewardAmount);
        expect(await farmingContract.rewardBalance()).eq(
            periodTwo.rewardAmount.add(oldRewardBalance)
        );
        expect(await farmingContract.stakedBalanceCurrPeriod()).eq(
            BigNumber.from('0')
        );
        expect(await farmingContract.totalParticipants()).eq(
            BigNumber.from('0')
        );
    });

    it('reproduces 2nd period, until it is closed by 3rd period opening', async () => {
        await wholePeriodOne();
        await time.increaseTo(periodTwo.at);
        await farmingContract.setNewPeriod(
            periodTwo.rewardAmount,
            periodTwo.start,
            periodTwo.end,
            periodTwo.lockDuration
        );

        ////////// user action //////////
        // Serhat renews - does get 14.7 rewards
        // Julia stakes

        // closed by period 3 opening
    });

    it.skip('reproduces 3rd period, until it is closed by 4th period opening', async () => {
        await wholePeriodOne();
        // await wholePeriodTwo();
        // open period 3

        ////////// user action //////////
        // Serhat renews - does not get any rewards
        // Bruno stakes
        // Serhat claims
        // Bruno claims

        // closed by period 4 opening
    });

    it.skip('reproduces 4th period - still running', async () => {
        await wholePeriodOne();
        // await wholePeriodTwo();
        // await wholePeriodThree();
        // open period 4

        ////////// user action //////////
        // Serhat renews - does get rewards
        // Bruno stakes
    });

    async function wholePeriodOne() {
        time.increaseTo(periodOne.at);
        await farmingContract.setNewPeriod(
            periodOne.rewardAmount,
            periodOne.start,
            periodOne.end,
            periodOne.lockDuration
        );

        // Serhat stakes
        await time.increaseTo(periodOneUserAction.serhat.stake.at);
        await farmingContract
            .connect(serhat)
            .stake(periodOneUserAction.serhat.stake.amount);
    }
});

const verifyEmptyStruct = (struct: any) => {
    for (let i = 0; i < struct.length; i++) {
        expect(struct[i]).eq(ethers.BigNumber.from('0'));
    }
};
