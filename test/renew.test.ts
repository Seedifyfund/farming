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
import { advanceToFuture } from './fixtures/BlockchainUtils';

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

        await rewardsToken.mint(deployer.address, 1000000);
        await stakingToken.mint(user.address, 100000);
        await stakingToken.mint(user2.address, 100000);
        await rewardsToken
            .connect(deployer)
            .approve(farmingContract.address, 1000000);
        await stakingToken
            .connect(user)
            .approve(farmingContract.address, 1000000);
        await stakingToken
            .connect(user2)
            .approve(farmingContract.address, 1000000);
    });

    it('then rewards are distributed to the user for previous periods', async () => {
        let currentTime = await time.latest();
        const periodDuration = 30 * 60 * 60; //30 hours
        const lockDuration = 1;
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );

        await advanceToFuture(offset + 1);

        await farmingContract.connect(user).stake(1000);

        await advanceToFuture(periodDuration);

        currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        await advanceToFuture(offset + 1);

        await farmingContract.connect(user).renew();

        // await farmingContract.connect(user).claimOldRewards();

        expect(await rewardsToken.balanceOf(user.address)).gt(0);
    });

    it.skip('then deposit reference reflects new date', async () => {});
    it.skip('then balance of user staked tokens does not change', async () => {});
});
