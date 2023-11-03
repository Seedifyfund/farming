import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';

import { SMD_v5, Token_Mock } from '../../typechain-types';
import { deployContracts, verifyEmptyStruct } from '../fixtures/TestUtils';
import {
    periodOne,
    periodOneUserAction,
    periodTwo,
} from '../fixtures/periods';

describe('simulating mainnet period 1 locally', () => {
    let deployer: SignerWithAddress;
    let serhat: SignerWithAddress;
    let julia: SignerWithAddress;
    let bruno: SignerWithAddress;
    let rewardsToken: Token_Mock;
    let stakingToken: Token_Mock;
    let farmingContract: SMD_v5;

    beforeEach(async () => {
        ({
            deployer,
            serhat,
            julia,
            bruno,
            rewardsToken,
            stakingToken,
            farmingContract,
        } = await deployContracts());
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
});
