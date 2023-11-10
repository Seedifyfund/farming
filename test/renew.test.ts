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

describe('when renewing a staking action', () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let user2: SignerWithAddress;
    let rewardsToken: Token_Mock;
    let stakingToken: Token_Mock;
    let farmingContract: SMD_v5;

    //Simulate the blockchain is 60s in future to prevent timestamp issues running time-based tests
    const offset = 60;

    beforeEach(async () => {
        [deployer, user, user2] = await ethers.getSigners();
        stakingToken = await new Token_Mock__factory(deployer).deploy();
        rewardsToken = await new Token_Mock__factory(deployer).deploy();
        farmingContract = await new SMD_v5__factory(deployer).deploy(
            stakingToken.address,
            rewardsToken.address
        );

        await rewardsToken.mint(deployer.address, toEth('1000000'));
        await stakingToken.mint(user.address, toEth('100000'));
        await stakingToken.mint(user2.address, toEth('100000'));
        await rewardsToken
            .connect(deployer)
            .approve(farmingContract.address, toEth('1000000'));
        await stakingToken
            .connect(user)
            .approve(farmingContract.address, toEth('1000000'));
        await stakingToken
            .connect(user2)
            .approve(farmingContract.address, toEth('1000000'));
    });

    it('then rewards are distributed to the user for previous periods', async () => {
        let currentTime = await time.latest();
        let start = currentTime + offset;

        const periodDuration = 30 * 60 * 60; //30 hours
        let end = currentTime + offset + periodDuration;

        const lockDuration = 1;

        console.log('end - start', end - start);

        console.log('///////////// First Period /////////////');
        await farmingContract.setNewPeriod(
            toEth('1000'),
            start,
            end,
            lockDuration
        );

        expect(await farmingContract.totalReward()).eq(toEth('1000'));
        expect(await farmingContract.rewardBalance()).eq(toEth('1000'));

        await advanceToFuture(offset);
        // stake directly at opening of period
        await farmingContract.connect(user).stake(toEth('1000'));

        await advanceToFuture(periodDuration);

        console.log('\n ///////////// Second Period /////////////');
        currentTime = await time.latest();
        start = currentTime + offset;
        end = currentTime + offset + periodDuration;

        await farmingContract.setNewPeriod(
            toEth('1000'),
            start,
            end,
            lockDuration
        );
        await advanceToFuture(offset);

        const rewToReceive = await farmingContract.viewOldRewards(
            user.address
        );

        // renew directly at opening of new period
        await farmingContract.connect(user).renew();

        // await farmingContract.connect(user).claimOldRewards();

        console.log('\nuser will receive: ', toDecimals(rewToReceive));
        expect(await rewardsToken.balanceOf(user.address)).eq(rewToReceive);
    });

    it.skip('then deposit reference reflects new date', async () => {});
    it.skip('then balance of user staked tokens does not change', async () => {});
});
