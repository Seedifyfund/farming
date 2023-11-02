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

describe('when withdrawing funds', () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let tokenContract: Token_Mock;
    let farmingContract: SMD_v5;

    //Simulate the blockchain is 60s in future to prevent timestamp issues running time-based tests
    const offset = 60;

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();
        tokenContract = await new Token_Mock__factory(deployer).deploy();
        farmingContract = await new SMD_v5__factory(deployer).deploy(
            tokenContract.address,
            tokenContract.address
        );

        await tokenContract.mint(deployer.address, 10000);
        await tokenContract.mint(user.address, 10000);
        await tokenContract.mint(farmingContract.address, 1000000);
        await tokenContract
            .connect(deployer)
            .approve(farmingContract.address, 10000);
        await tokenContract
            .connect(user)
            .approve(farmingContract.address, 10000);
    });

    it('then should be able to withdraw funds for current period', async () => {
        let currentTime = await time.latest();
        const periodDuration = 3 * 60 * 60; //3 hours
        const lockDuration = 1; //1 hour
        const stakeAmount = 1000;
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        const originalBalance = await tokenContract.balanceOf(user.address);
        const stakingPeriod = await farmingContract.periodCounter();

        await advanceToFuture(offset + 30);
        await farmingContract.connect(user).stake(stakeAmount);
        await advanceToFuture(lockDuration * 60 * 60);

        const tx = farmingContract.connect(user).withdraw(stakeAmount);

        const userDepositPeriod = (
            await farmingContract.userDeposits(user.address)
        ).currentPeriod;

        expect(userDepositPeriod).to.eq(stakingPeriod);
        await expect(tx).to.not.be.reverted;

        const newBalance = await tokenContract.balanceOf(user.address);
        expect(newBalance).to.eq(originalBalance);
    });

    it('then should be able to withdraw funds for previous periods', async () => {
        let currentTime = await time.latest();
        const periodDuration = 3 * 60 * 60; //3 hours
        const lockDuration = 1; //1 hour
        const stakeAmount = 1000;
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        const originalBalance = await tokenContract.balanceOf(user.address);
        const stakingPeriod = await farmingContract.periodCounter();

        await advanceToFuture(offset + 30);
        await farmingContract.connect(user).stake(stakeAmount);
        await advanceToFuture(periodDuration);

        currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        await advanceToFuture(offset + 30); //New period is now active

        const userDepositPeriod = (
            await farmingContract.userDeposits(user.address)
        ).currentPeriod;
        const currentPeriod = await farmingContract.periodCounter();
        expect(stakingPeriod).to.eq(userDepositPeriod);
        expect(userDepositPeriod).to.lt(currentPeriod);

        const tx = farmingContract.connect(user).withdraw(stakeAmount);
        await expect(tx).to.not.be.reverted;

        const newBalance = await tokenContract.balanceOf(user.address);
        expect(newBalance).to.eq(originalBalance);
    });

    it('then should be able to withdraw funds for even older periods', async () => {
        let currentTime = await time.latest();
        const periodDuration = 3 * 60 * 60; //3 hours
        const lockDuration = 1; //1 hour
        const stakeAmount = 1000;
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        const originalBalance = await tokenContract.balanceOf(user.address);
        const stakingPeriod = await farmingContract.periodCounter();

        await advanceToFuture(offset + 30);
        await farmingContract.connect(user).stake(stakeAmount);
        await advanceToFuture(periodDuration);

        //Advance two periods
        currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        await advanceToFuture(offset + periodDuration);
        currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        await advanceToFuture(offset + periodDuration);

        const userDepositPeriod = (
            await farmingContract.userDeposits(user.address)
        ).currentPeriod;
        const currentPeriod = await farmingContract.periodCounter();
        expect(stakingPeriod).to.eq(userDepositPeriod);
        expect(userDepositPeriod).to.lt(currentPeriod);

        const tx = farmingContract.connect(user).withdraw(stakeAmount);
        await expect(tx).to.not.be.reverted;

        const newBalance = await tokenContract.balanceOf(user.address);
        expect(newBalance).to.eq(originalBalance);
    });
});
